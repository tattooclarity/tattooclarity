// app/api/download/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export const runtime = "nodejs";

/** 根據後綴回傳正確的 Content-Type */
function contentTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml; charset=utf-8";
  if (ext === ".zip") return "application/zip";
  return "application/octet-stream";
}

/** 遞歸搜尋資料夾內所有 PNG (用於 Mystery 方案) */
function getAllPngsAbs(dirAbs: string, out: string[] = []) {
  if (!fs.existsSync(dirAbs)) return out;
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dirAbs, e.name);
    if (e.isDirectory()) {
      getAllPngsAbs(abs, out);
    } else if (e.isFile()) {
      if (e.name.toLowerCase().endsWith(".png")) out.push(abs);
    }
  }
  return out;
}

/** 根據 order_id 生成穩定的索引 */
function stableIndex(orderId: string, n: number) {
  if (!orderId || n <= 0) return 0;
  const hex = crypto.createHash("sha256").update(orderId).digest("hex");
  const num = parseInt(hex.slice(0, 8), 16);
  return Number.isFinite(num) ? num % n : 0;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const planRaw = (url.searchParams.get("plan") || "").trim().toLowerCase();
    let file = (url.searchParams.get("file") || "").trim();
    const orderId = (url.searchParams.get("order_id") || "").trim();

    // Vercel 環境路徑
    const ROOT = path.join(process.cwd(), "storage", "designs");

    /**
     * ✅ plan -> folder mapping
     * 允許前端直接傳 folder key（premium_png / premium_svg / mystery_png）
     */
    const PLAN_TO_FOLDER: Record<string, string> = {
      basic: "basic_png",
      standard: "standard_png",
      premium: "premium_png", // 預設 premium 係 PNG
      premium_png: "premium_png",
      premium_svg: "premium_svg",
      mystery: "mystery_png",
      mystery_png: "mystery_png",
    };

    // ✅ 如果前端直接傳 folder key，照收；否則用 mapping
    let planFolder = PLAN_TO_FOLDER[planRaw] || planRaw;

    // ✅ 防止 file 係空時就做 .toLowerCase() 爆
    const fileExt = path.extname(file || "").toLowerCase();

    /**
     * ✅ 關鍵修正（保險）：
     * - 如果有人用 plan=premium 但 file 係 .svg
     * - 或者 plan=premium_png 但 file 係 .svg
     * 都自動轉去 premium_svg folder
     */
    if (
      (planRaw === "premium" || planRaw === "premium_png") &&
      fileExt === ".svg"
    ) {
      planFolder = "premium_svg";
    }

    // ==========================================
    // 🎲 Mystery：隨機抽圖（鎖定 order_id）
    // ==========================================
    if (planRaw === "mystery" || planRaw === "mystery_png") {
      const targetDir = path.join(ROOT, "mystery_png");

      const allPngs = getAllPngsAbs(targetDir);
      if (allPngs.length === 0) {
        console.error("[Download] Mystery folder empty or missing:", targetDir);
        return NextResponse.json(
          { error: "No files available for mystery" },
          { status: 404 }
        );
      }

      const idx = orderId
        ? stableIndex(orderId, allPngs.length)
        : Math.floor(Math.random() * allPngs.length);

      const absPath = allPngs[idx];
      const buf = fs.readFileSync(absPath);

      const safeName = orderId
        ? `Mystery_Tattoo_${orderId.slice(-6)}.png`
        : "Mystery_Tattoo.png";

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${safeName}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ==========================================
    // 📦 Normal：需要 file 參數
    // ==========================================
    if (!file) {
      return NextResponse.json(
        { error: "Missing file parameter" },
        { status: 400 }
      );
    }

    // ✅ 移除開頭斜線（避免變成絕對路徑）
    while (file.startsWith("/")) file = file.slice(1);

    // ✅ 安全檢查：防止路徑跳脫
    if (file.includes("..") || file.includes("\\") || file.includes("\0")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const baseDir = path.join(ROOT, planFolder);
    let finalPath = path.join(baseDir, file);

    // ✅ 再做一次「必須留喺 baseDir」的保護（防 path traversal）
    const resolvedBase = path.resolve(baseDir) + path.sep;
    const resolvedFinal = path.resolve(finalPath);
    if (!resolvedFinal.startsWith(resolvedBase)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let found = fs.existsSync(finalPath);

    // ✅ 容錯：如果搵唔到，試下喺子資料夾搵（1 層）
    if (!found) {
      const pureFileName = path.basename(file);
      if (fs.existsSync(baseDir)) {
        try {
          const entries = fs.readdirSync(baseDir, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const tryPath = path.join(baseDir, entry.name, pureFileName);
            if (fs.existsSync(tryPath)) {
              finalPath = tryPath;
              found = true;
              break;
            }
          }
        } catch (e) {
          console.error("[Download] Scan error:", e);
        }
      }
    }

    if (!found) {
      console.error("[Download] 404 Not Found:", {
        plan: planRaw,
        folder: planFolder,
        file,
        expectedPath: finalPath,
      });
      return NextResponse.json(
        { error: "File not found on server", details: `Target: ${planFolder}/${file}` },
        { status: 404 }
      );
    }

    const buf = fs.readFileSync(finalPath);
    const outName = path.basename(finalPath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeByExt(finalPath),
        "Content-Disposition": `attachment; filename="${outName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Download Route Error:", err);
    return NextResponse.json(
      { error: "Server error", details: err?.message },
      { status: 500 }
    );
  }
}