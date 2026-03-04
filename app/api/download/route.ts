import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// 你現有 folder 命名（跟你截圖：basic_png / standard_png / premium_png / premium_svg）
const PLAN_TO_FOLDER: Record<string, string> = {
  basic: "basic_png",
  standard: "standard_png",
  premium: "premium_png",
  premium_png: "premium_png",
  premium_svg: "premium_svg",
  mystery: "standard_png", // ✅ Mystery 先當 standard_png 範圍搵
};

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
      return NextResponse.json({ error: "Missing parameters: plan/file" }, { status: 400 });
    }

    // ✅ 防止 ../ 走位
    if (file.includes("..")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const planFolder = PLAN_TO_FOLDER[plan] || plan; // 允許你直接傳 standard_png
    const baseDir = path.join(process.cwd(), "storage", "designs", planFolder);

    // 1️⃣ 第一試：直接用前端傳入的路徑
    let finalPath = path.join(baseDir, file);

    // ✅ 再保險：確保 finalPath 仍在 baseDir 內
    const resolvedBase = path.resolve(baseDir) + path.sep;
    const resolvedFinal = path.resolve(finalPath);
    if (!resolvedFinal.startsWith(resolvedBase)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    let found = fs.existsSync(finalPath);

    // 2️⃣ 第二試：如果找不到 → 掃 plan 底下所有子資料夾（balance/serenity/...）
    if (!found) {
      const pureFileName = path.basename(file); // 忽略前面 balance/
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

    // 3️⃣ 最終仍找不到 → 回 404（你就會下載到 json）
    if (!found) {
      console.error("[download] Not found:", { planFolder, file });
      return NextResponse.json(
        { error: "File not found anywhere", planFolder, file, baseDir },
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
    console.error("[download] Error:", err);
    return NextResponse.json(
      { error: "Server error", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}