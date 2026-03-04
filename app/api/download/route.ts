// app/api/download/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

// ✅ 你而家真實檔案位置係 storage/designs/<plan>/<file>
const DESIGNS_ROOT = path.join(process.cwd(), "storage", "designs");

// ✅ 只允許呢幾個 plan（避免人亂讀你伺服器檔案）
const ALLOWED_PLANS = new Set([
  "basic_png",
  "standard",
  "premium_png",
  "premium_svg",
  "mystery_png",
  "mystery_svg",
  // 如果你之後有其他資料夾（例如 standard_png），加喺呢度
]);

function safeJoin(baseDir: string, subPath: string) {
  // 防止 ../ path traversal
  const normalized = subPath.replace(/^\/+/, "");
  const full = path.join(baseDir, normalized);
  const rel = path.relative(baseDir, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return full;
}

function contentTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml; charset=utf-8";
  if (ext === ".zip") return "application/zip";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

// ✅ 舊版 mystery fallback：用 order_id 固定抽一個檔（每張單固定）
function pickMysteryByOrderId(): string | null {
  try {
    const manifestPath = path.join(process.cwd(), "storage", "manifests", "mystery_pool.json");
    if (!fs.existsSync(manifestPath)) return null;
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const data = JSON.parse(raw);
    const files: string[] = Array.isArray(data?.files) ? data.files : [];
    if (!files.length) return null;
    return files[0] || null;
  } catch {
    return null;
  }
}

function pickMysteryDeterministic(orderId: string): string | null {
  try {
    const manifestPath = path.join(process.cwd(), "storage", "manifests", "mystery_pool.json");
    if (!fs.existsSync(manifestPath)) return null;
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const data = JSON.parse(raw);
    const files: string[] = Array.isArray(data?.files) ? data.files : [];
    if (!files.length) return null;

    // 用 hash orderId 固定抽
    const hash = crypto.createHash("sha256").update(orderId).digest();
    const num = hash.readUInt32BE(0);
    const idx = num % files.length;
    return files[idx] || files[0] || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") || "").trim();
    const file = (url.searchParams.get("file") || "").trim();
    const orderId = (url.searchParams.get("order_id") || "").trim();

    if (!plan) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    // ✅ 舊 mystery fallback：/api/download?plan=mystery&order_id=cs_...
    if (plan === "mystery") {
      if (!orderId) {
        return NextResponse.json({ error: "Missing order_id for mystery" }, { status: 400 });
      }
      const picked = pickMysteryDeterministic(orderId) || pickMysteryByOrderId();
      if (!picked) {
        return NextResponse.json({ error: "Mystery pool is empty" }, { status: 404 });
      }

      // 你 checkout 以前可能係回傳檔名本身（例如 mystery_xxx.png）
      // 我哋預設放喺 storage/designs/mystery_png/<picked>
      const baseDir = path.join(DESIGNS_ROOT, "mystery_png");
      const fullPath = safeJoin(baseDir, picked);
      if (!fullPath) {
        return NextResponse.json({ error: "Invalid mystery file path" }, { status: 400 });
      }
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json(
          { error: "File not found on server", details: `Target: mystery_png/${picked}` },
          { status: 404 }
        );
      }

      const buf = fs.readFileSync(fullPath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": contentTypeByExt(fullPath),
          "Content-Disposition": `attachment; filename="${path.basename(fullPath)}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ✅ 正常 plan（premium_png / premium_svg / mystery_png ...）
    if (!ALLOWED_PLANS.has(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const baseDir = path.join(DESIGNS_ROOT, plan);
    const fullPath = safeJoin(baseDir, file);

    if (!fullPath) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: "File not found on server", details: `Target: ${plan}/${file}` },
        { status: 404 }
      );
    }

    const buf = fs.readFileSync(fullPath);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentTypeByExt(fullPath),
        "Content-Disposition": `attachment; filename="${path.basename(fullPath)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Download error" }, { status: 500 });
  }
}