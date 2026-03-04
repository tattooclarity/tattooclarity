// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const PLAN_TO_FOLDER: Record<string, string> = {
  basic: "basic_png",
  standard: "standard_png",
  premium: "premium_png",
  
  // 允許前端直接傳 folder key
  basic_png: "basic_png",
  standard_png: "standard_png",
  premium_png: "premium_png",
  premium_svg: "premium_svg",

  mystery: "standard_png",
};

const ALLOWED_FOLDERS = new Set(Object.values(PLAN_TO_FOLDER));
const ALLOWED_EXT = new Set([".png", ".svg", ".zip"]);

function contentTypeByExt(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".svg") return "image/svg+xml; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".zip") return "application/zip";
  return "application/octet-stream";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plan = (searchParams.get("plan") || "").trim();
    let file = (searchParams.get("file") || "").trim();

    if (!plan || !file) {
      return NextResponse.json(
        { error: "Missing parameters: plan or file" },
        { status: 400 }
      );
    }

    // ✅ [FIX] 自動移除開頭的斜線 (避免 theme 為空時變成 /filename.svg 導致報錯)
    while (file.startsWith("/")) {
      file = file.substring(1);
    }

    // ✅ 安全檢查：防止 ../ 或 Windows 反斜線
    if (file.includes("..") || file.includes("\\")) {
      return NextResponse.json({ error: "Invalid file path security check" }, { status: 400 });
    }

    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "Invalid file type", ext },
        { status: 400 }
      );
    }

    const planFolder = PLAN_TO_FOLDER[plan] || plan;
    if (!ALLOWED_FOLDERS.has(planFolder)) {
      return NextResponse.json(
        { error: "Invalid plan folder", plan },
        { status: 400 }
      );
    }

    // 設定 Base Directory
    const baseDir = path.join(process.cwd(), "storage", "designs", planFolder);

    // 1️⃣ 第一試：直接路徑
    let finalPath = path.join(baseDir, file);

    // ✅ 路徑逃逸檢查 (Path Traversal Check)
    const resolvedBase = path.resolve(baseDir) + path.sep;
    const resolvedFinal = path.resolve(finalPath);
    
    // 注意：這裡只檢查是否在 storage/designs 內，不一定要在 baseDir 內 (如果有的話)
    // 但為了安全，最好限制在 planFolder 內
    if (!resolvedFinal.startsWith(path.resolve(process.cwd(), "storage", "designs"))) {
       return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let found = fs.existsSync(finalPath);

    // 2️⃣ 第二試：如果找不到，嘗試搜尋子資料夾 (容錯機制)
    if (!found) {
      const pureFileName = path.basename(file); // 只取檔名
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
      // 🛑 這是關鍵：如果這裡觸發，Vercel Logs 會告訴你它試圖找什麼路徑
      console.error("[download] File NOT FOUND:", {
        planParam: plan,
        folderUsed: planFolder,
        lookingFor: file,
        finalPathTried: finalPath
      });
      
      return NextResponse.json(
        { error: "File not found on server", file: path.basename(file) },
        { status: 404 }
      );
    }

    // 4️⃣ 回傳檔案
    const buf = fs.readFileSync(finalPath);
    const fileName = path.basename(finalPath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeByExt(fileName),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });

  } catch (err: any) {
    console.error("[download] Server Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: String(err) },
      { status: 500 }
    );
  }
}