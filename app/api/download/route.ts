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
     * 基礎資料夾對應
     */
    const PLAN_TO_FOLDER: Record<string, string> = {
      basic: "basic_png",
      standard: "standard_png",
      premium: "premium_png", // 預設為 PNG
      mystery: "mystery_png",
    };

    let planFolder = PLAN_TO_FOLDER[planRaw] || planRaw;

    // ✅ 關鍵修正：如果是 Premium 且檔案是 .svg，自動跳轉到 premium_svg 資料夾
    if (planRaw === "premium" && file.toLowerCase().endsWith(".svg")) {
      planFolder = "premium_svg";
    }

    // ==========================================
    // 🎲 方案 A：Mystery (隨機抽圖)
    // ==========================================
    if (planRaw === "mystery" || planRaw === "mystery_png") {
      const targetDir = path.join(ROOT, "mystery_png");

      const allPngs = getAllPngsAbs(targetDir);
      if (allPngs.length === 0) {
        console.error("[Download] Mystery folder empty or missing:", targetDir);
        return NextResponse.json({ error: "No files available for mystery" }, { status: 404 });
      }

      const idx = orderId ? stableIndex(orderId, allPngs.length) : Math.floor(Math.random() * allPngs.length);
      const absPath = allPngs[idx];
      const buf = fs.readFileSync(absPath);

      const safeName = orderId ? `Mystery_Tattoo_${orderId.slice(-6)}.png` : "Mystery_Tattoo.png";

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
    // 📦 方案 B：正常下載 (需要 file 參數)
    // ==========================================
    if (!file) {
      return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
    }

    // 安全檢查：防止路徑跳脫
    if (file.includes("..") || file.includes("\\") || file.includes("\0")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const baseDir = path.join(ROOT, planFolder);
    let finalPath = path.join(baseDir, file);
    let found = fs.existsSync(finalPath);

    // ✅ 容錯機制：如果搵唔到，試下喺子資料夾搵（例如 Duo Plan 嘅 Set 1 / Set 2）
    if (!found) {
      const pureFileName = path.basename(file);
      if (fs.existsSync(baseDir)) {
        try {
          const entries = fs.readdirSync(baseDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const tryPath = path.join(baseDir, entry.name, pureFileName);
              if (fs.existsSync(tryPath)) {
                finalPath = tryPath;
                found = true;
                break;
              }
            }
          }
        } catch (e) {
          console.error("[Download] Scan error:", e);
        }
      }
    }

    if (!found) {
      // 呢度嘅 log 會喺 Vercel 控制台出現，幫你 debug 係咪路徑寫錯
      console.error("[Download] 404 Not Found:", {
        plan: planRaw,
        folder: planFolder,
        expectedPath: finalPath
      });
      return NextResponse.json({ error: "File not found on server", details: `Target: ${planFolder}/${file}` }, { status: 404 });
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
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}