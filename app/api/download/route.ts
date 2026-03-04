// app/api/download/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

// ✅ 1. 輔助函數：根據副檔名決定 Content-Type
function contentTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml; charset=utf-8";
  if (ext === ".zip") return "application/zip";
  return "application/octet-stream";
}

// ✅ 2. 輔助函數：遞歸掃描資料夾找出所有 PNG (給 Mystery 用)
function getAllPngs(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllPngs(filePath, fileList);
    } else {
      if (file.toLowerCase().endsWith(".png")) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") || "").trim(); // 修正：用 trim()
    let file = (url.searchParams.get("file") || "").trim();
    const orderId = url.searchParams.get("order_id") || "";

    const ROOT = path.join(process.cwd(), "storage", "designs");

    // Folder Mapping
    const PLAN_TO_FOLDER: Record<string, string> = {
      basic: "basic_png",
      standard: "standard_png",
      premium: "premium_png", // 舊參數名
      premium_png: "premium_png",
      premium_svg: "premium_svg",
      // Mystery 使用 Standard 的圖庫 (或者 mystery_png 如果你有分開)
      mystery: "standard_png", 
    };

    const planFolder = PLAN_TO_FOLDER[plan];
    if (!planFolder) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ==========================================
    // 🎲 MYSTERY 邏輯：隨機抽圖 (鎖定 Order ID)
    // ==========================================
    if (plan === "mystery") {
      const targetDir = path.join(ROOT, "standard_png"); // 或 mystery_png

      // 1. 找出所有可用圖片
      const allPngs = getAllPngs(targetDir);

      if (allPngs.length === 0) {
        return NextResponse.json({ error: "No files available for mystery" }, { status: 404 });
      }

      // 2. 使用 Order ID 算出固定索引
      let pickIndex = 0;
      if (orderId) {
        let sum = 0;
        for (let i = 0; i < orderId.length; i++) {
          sum += orderId.charCodeAt(i);
        }
        pickIndex = sum % allPngs.length;
      } else {
        pickIndex = Math.floor(Math.random() * allPngs.length);
      }

      const absPath = allPngs[pickIndex];
      const buf = fs.readFileSync(absPath);
      
      // 下載時隱藏真實檔名
      const safeName = orderId ? `Mystery_Tattoo_${orderId.slice(-4)}.png` : "Mystery_Tattoo.png";

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
    // 📂 一般 PLAN (Basic/Standard/Premium)
    // ==========================================
    
    // 檢查 file 參數
    if (!file) {
      return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
    }

    // 自動移除開頭斜線
    while (file.startsWith("/")) file = file.substring(1);

    // 安全檢查
    if (file.includes("..") || file.includes("\\")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const baseDir = path.join(ROOT, planFolder);
    let finalPath = path.join(baseDir, file);
    let found = fs.existsSync(finalPath);

    // ✅ 容錯機制：如果找不到，嘗試掃描子資料夾 (你原本代碼的優點)
    if (!found) {
      const pureFileName = path.basename(file);
      if (fs.existsSync(baseDir)) {
        try {
          const subFolders = fs
            .readdirSync(baseDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);

          for (const folder of subFolders) {
            const tryPath = path.join(baseDir, folder, pureFileName);
            if (fs.existsSync(tryPath)) {
              finalPath = tryPath;
              found = true;
              break;
            }
          }
        } catch (e) {
          console.error("Error scanning subfolders:", e);
        }
      }
    }

    if (!found) {
      console.error("[Download] Not found:", { plan, file, finalPath });
      return NextResponse.json({ error: "File not found on server", file }, { status: 404 });
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