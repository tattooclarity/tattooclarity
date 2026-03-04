// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// 你實際 storage/designs 底下 folder 名，按你原本用法做 mapping
const PLAN_TO_FOLDER: Record<string, string> = {
  basic: "basic_png",
  standard: "standard_png",
  premium: "premium_png",
  mystery: "standard_png", // mystery 走 standard_png

  // 允許前端直接傳 folder key
  basic_png: "basic_png",
  standard_png: "standard_png",
  premium_png: "premium_png",
  premium_svg: "premium_svg",
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

function stripLeadingSlashes(p: string) {
  let s = (p || "").trim();
  while (s.startsWith("/")) s = s.slice(1);
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const planParam = (searchParams.get("plan") || "").trim();
    let file = stripLeadingSlashes(searchParams.get("file") || "");

    if (!planParam || !file) {
      return NextResponse.json({ error: "Missing parameters: plan or file" }, { status: 400 });
    }

    // ✅ 安全：禁止 ../ 及 windows 反斜線
    if (file.includes("..") || file.includes("\\")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: "Invalid file type", ext }, { status: 400 });
    }

    const planFolder = PLAN_TO_FOLDER[planParam] || planParam;
    if (!ALLOWED_FOLDERS.has(planFolder)) {
      return NextResponse.json({ error: "Invalid plan folder", plan: planParam }, { status: 400 });
    }

    // ✅ 只容許讀取該 planFolder 入面嘅檔
    const baseDir = path.join(process.cwd(), "storage", "designs", planFolder);

    // 1) 直接 path
    let finalPath = path.join(baseDir, file);

    // ✅ 最關鍵：Path Traversal 防護必須限制在 baseDir
    const resolvedBase = path.resolve(baseDir) + path.sep;
    const resolvedFinal = path.resolve(finalPath);
    if (!resolvedFinal.startsWith(resolvedBase)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let found = fs.existsSync(finalPath);

    // 2) 容錯：如果搵唔到，就 scan 一層子 folder 用純檔名找
    if (!found) {
      const pureFileName = path.basename(file);
      if (fs.existsSync(baseDir)) {
        const subFolders = fs
          .readdirSync(baseDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);

        for (const folder of subFolders) {
          const tryPath = path.join(baseDir, folder, pureFileName);
          const rTry = path.resolve(tryPath);
          if (rTry.startsWith(resolvedBase) && fs.existsSync(tryPath)) {
            finalPath = tryPath;
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      console.error("[download] NOT FOUND", {
        planParam,
        planFolder,
        file,
        tried: finalPath,
        baseDir,
      });
      return NextResponse.json({ error: "File not found", file: path.basename(file) }, { status: 404 });
    }

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
    return NextResponse.json({ error: "Internal Server Error", message: String(err) }, { status: 500 });
  }
}