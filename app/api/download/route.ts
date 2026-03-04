// app/api/download/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

function safeJoin(base: string, target: string) {
  const p = path.normalize(path.join(base, target));
  if (!p.startsWith(base)) throw new Error("Invalid file path");
  return p;
}

function contentTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".zip") return "application/zip";
  return "application/octet-stream";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") || "").toLowerCase();
    const file = url.searchParams.get("file") || "";

    const ROOT = path.join(process.cwd(), "storage", "designs");

    // ✅ 你的 plan->folder 映射（按你現有結構）
    const PLAN_DIR: Record<string, string> = {
      basic: "basic_png",
      standard: "standard_png",
      premium_png: "premium_png",
      premium_svg: "premium_svg",
      // ✅ 重要：mystery 其實係用 standard_png
      mystery: "standard_png",
    };

    const folder = PLAN_DIR[plan];
    if (!folder) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ✅ 1) MYSTERY：隨機揀 standard_png/mystery 內任何 .png
    if (plan === "mystery") {
      const mysteryDir = path.join(ROOT, "standard_png", "mystery");
      const all = await fs.readdir(mysteryDir);

      const pngs = all.filter((n) => n.toLowerCase().endsWith(".png"));
      if (pngs.length === 0) {
        return NextResponse.json(
          { error: "No mystery PNG files found", dir: "standard_png/mystery" },
          { status: 404 }
        );
      }

      const pick = pngs[Math.floor(Math.random() * pngs.length)];
      const abs = safeJoin(mysteryDir, pick);
      const buf = await fs.readFile(abs);

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${pick}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ✅ 2) 其他 plan：照你原本的 file 路徑下載
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const baseDir = path.join(ROOT, folder);
    const absPath = safeJoin(baseDir, file);

    // 防止讀不到
    const buf = await fs.readFile(absPath);

    const ct = contentTypeByExt(absPath);
    const outName = path.basename(absPath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Content-Disposition": `attachment; filename="${outName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "File not found on server" },
      { status: 404 }
    );
  }
}