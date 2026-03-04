// app/api/download/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export const runtime = "nodejs";

/** Content-Type by extension */
function contentTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml; charset=utf-8";
  if (ext === ".zip") return "application/zip";
  return "application/octet-stream";
}

/** Recursively collect all PNG files under a directory (absolute paths) */
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

/** Deterministic index from order_id (stable across downloads) */
function stableIndex(orderId: string, n: number) {
  if (!orderId || n <= 0) return 0;
  const hex = crypto.createHash("sha256").update(orderId).digest("hex");
  // take first 8 hex chars => 32-bit
  const num = parseInt(hex.slice(0, 8), 16);
  return Number.isFinite(num) ? num % n : 0;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const planRaw = (url.searchParams.get("plan") || "").trim();
    let file = (url.searchParams.get("file") || "").trim();
    const orderId = (url.searchParams.get("order_id") || "").trim();

    const ROOT = path.join(process.cwd(), "storage", "designs");

    /**
     * plan -> folder mapping (inside storage/designs/)
     * ✅ A 方案：mystery -> mystery_png
     */
    const PLAN_TO_FOLDER: Record<string, string> = {
      basic: "basic_png",
      standard: "standard_png",
      premium: "premium_png", // allow old param
      premium_png: "premium_png",
      premium_svg: "premium_svg",
      mystery: "mystery_png",
      mystery_png: "mystery_png",
    };

  const planFolder = PLAN_TO_FOLDER[planRaw];
if (!planFolder) {
  return new Response("Invalid plan", { status: 400 });
}

    // ==========================================
    // 🎲 A方案：MYSTERY (no file param needed)
    // ==========================================
    if (planRaw === "mystery" || planRaw === "mystery_png") {
      const targetDir = path.join(ROOT, "mystery_png"); // ✅ 你而家用呢個 folder

      const allPngs = getAllPngsAbs(targetDir);
      if (allPngs.length === 0) {
        return NextResponse.json(
          { error: "No files available for mystery" },
          { status: 404 }
        );
      }

      // ✅ locked-to-order (same order always same image)
      const idx = orderId
        ? stableIndex(orderId, allPngs.length)
        : Math.floor(Math.random() * allPngs.length);

      const absPath = allPngs[idx];
      const buf = fs.readFileSync(absPath);

      // ✅ hide real filename
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
    // 📦 Normal plans need file param
    // ==========================================
    if (!file) {
      return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
    }

    // remove leading slashes
    while (file.startsWith("/")) file = file.slice(1);

    // basic path traversal protection
    if (file.includes("..") || file.includes("\\") || file.includes("\0")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const baseDir = path.join(ROOT, planFolder);
    let finalPath = path.join(baseDir, file);
    let found = fs.existsSync(finalPath);

    // ✅ tolerance: if not found, scan 1-level subfolders for same basename
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
      console.error("[Download] Not found:", { plan: planRaw, file, finalPath });
      return NextResponse.json(
        { error: "File not found on server", file },
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