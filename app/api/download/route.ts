// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// ✅ 你現有 folder 命名（basic_png / standard_png / premium_png / premium_svg）
const PLAN_TO_FOLDER: Record<string, string> = {
  basic: "basic_png",
  standard: "standard_png",
  premium: "premium_png",

  // 允許前端直接傳 folder 名
  basic_png: "basic_png",
  standard_png: "standard_png",
  premium_png: "premium_png",
  premium_svg: "premium_svg",

  // Mystery 暫時當 standard_png
  mystery: "standard_png",
};

// ✅ 嚴格限制只可落呢幾個 folder（避免 plan=../../ 之類被濫用）
const ALLOWED_FOLDERS = new Set(Object.values(PLAN_TO_FOLDER));

// ✅ 允許下載的副檔名
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
    const file = (searchParams.get("file") || "").trim();

    if (!plan || !file) {
      return NextResponse.json(
        { error: "Missing parameters: plan/file" },
        { status: 400 }
      );
    }

    // ✅ 防止 ../ 或 Windows 反斜線
    if (file.includes("..") || file.includes("\\") || file.startsWith("/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // ✅ 限制副檔名
    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "Invalid file type", ext },
        { status: 400 }
      );
    }

    // ✅ 把 plan 轉成 folder；如果 plan 本身已經係 folder 名，都可以
    const planFolder = PLAN_TO_FOLDER[plan] || plan;

    if (!ALLOWED_FOLDERS.has(planFolder)) {
      return NextResponse.json(
        { error: "Invalid plan", plan, planFolder },
        { status: 400 }
      );
    }

    const baseDir = path.join(process.cwd(), "storage", "designs", planFolder);

    // 1️⃣ 第一試：直接用前端傳入的相對路徑
    let finalPath = path.join(baseDir, file);

    // ✅ 確保 finalPath 仍在 baseDir 內
    const resolvedBase = path.resolve(baseDir) + path.sep;
    const resolvedFinal = path.resolve(finalPath);
    if (!resolvedFinal.startsWith(resolvedBase)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    let found = fs.existsSync(finalPath);

    // 2️⃣ 第二試：找唔到就掃子資料夾（strength/ love/ ...）
    if (!found) {
      const pureFileName = path.basename(file); // 忽略 strength/
      if (fs.existsSync(baseDir)) {
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
      }
    }

    if (!found) {
      console.error("[download] Not found:", { planFolder, file, baseDir });
      return NextResponse.json(
        { error: "File not found", planFolder, file },
        { status: 404 }
      );
    }

    // 4️⃣ 回傳檔案
    const buf = fs.readFileSync(finalPath);
    const fileName = path.basename(finalPath);

    // ✅ Content-Disposition：attachment 下載
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeByExt(fileName),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });
  } catch (err: any) {
    console.error("[download] Error:", err);
    return NextResponse.json(
      { error: "Server error", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}