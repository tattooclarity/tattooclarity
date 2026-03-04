// app/api/download/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

function contentTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".zip") return "application/zip";
  return "application/octet-stream";
}

// ✅ 遞歸掃描資料夾，找出所有 PNG 檔案 (為了 Mystery 功能)
function getAllPngs(dir: string, fileList: string[] = []) {
  // 如果資料夾不存在，直接返回空陣列
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllPngs(filePath, fileList);
    } else {
      // 只收集 PNG
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
    const plan = (url.searchParams.get("plan") || "").toLowerCase();
    const file = url.searchParams.get("file") || "";
    const orderId = url.searchParams.get("order_id") || "";

    const ROOT = path.join(process.cwd(), "storage", "designs");

    // ✅ Plan -> Folder 映射
    const PLAN_DIR: Record<string, string> = {
      basic: "basic_png",
      standard: "standard_png",
      premium_png: "premium_png",
      premium_svg: "premium_svg",
      // Mystery 使用 Standard 的圖庫
      mystery: "standard_png", 
    };

    const folderName = PLAN_DIR[plan];
    if (!folderName) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ==========================================
    // 🎲 MYSTERY 邏輯：在 Standard 裡隨機抽一張 (鎖定 Order ID)
    // ==========================================
    if (plan === "mystery") {
      const targetDir = path.join(ROOT, "standard_png");

      // 1. 找出 standard_png 內所有圖片 (包含子資料夾)
      // 注意：這會掃描所有 Standard 圖片作為抽獎池
      const allPngs = getAllPngs(targetDir);

      if (allPngs.length === 0) {
        return NextResponse.json({ error: "No files available for mystery" }, { status: 404 });
      }

      // 2. 使用 Order ID 算出固定索引 (Deterministic Random)
      // 算法：加總 Order ID 所有字符的 Code，然後對圖片總數取餘數
      let pickIndex = 0;
      if (orderId) {
        let sum = 0;
        for (let i = 0; i < orderId.length; i++) {
          sum += orderId.charCodeAt(i);
        }
        pickIndex = sum % allPngs.length;
      } else {
        // Fallback: 如果沒有 Order ID 就真隨機
        pickIndex = Math.floor(Math.random() * allPngs.length);
      }

      // 3. 讀取選中的檔案
      const absPath = allPngs[pickIndex];
      const buf = fs.readFileSync(absPath);
      
      // 為了保持神秘感，下載時檔名隱藏原始名稱
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
    // 📂 其他 PLAN 正常下載邏輯 (Standard / Premium / Basic)
    // ==========================================
    if (!file) {
      return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
    }

    // 安全檢查：防止路徑跳脫 (../)
    if (file.includes("..") || file.startsWith("/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const baseDir = path.join(ROOT, folderName);
    const absPath = path.join(baseDir, file);

    // 檢查檔案是否存在
    if (!fs.existsSync(absPath)) {
      console.error(`[Download] File not found: ${absPath}`);
      return NextResponse.json({ error: "File not found", file }, { status: 404 });
    }

    const buf = fs.readFileSync(absPath);
    const outName = path.basename(absPath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeByExt(absPath),
        "Content-Disposition": `attachment; filename="${outName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });

  } catch (err: any) {
    console.error("Download Route Error:", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}