// app/api/download/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PLAN_FOLDER_MAP: Record<string, string> = {
  basic: "basic_png",
  basic_png: "basic_png",
  standard: "standard_png",
  standard_png: "standard_png",
  premium: "premium_png",
  premium_png: "premium_png",
  premium_svg: "premium_svg",
  mystery: "mystery_png",
  mystery_png: "mystery_png",
};

function safeStr(v: unknown) {
  return typeof v === "string" ? v : "";
}

function isBadPath(p: string) {
  return (
    !p ||
    p.includes("..") ||
    p.includes("\\") ||
    p.startsWith("/") ||
    p.startsWith("http://") ||
    p.startsWith("https://")
  );
}

function encodePathKeepSlash(p: string) {
  return p
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function contentDisposition(filename: string) {
  const ascii = filename.replace(/[^A-Za-z0-9._-]/g, "_");
  const utf8 = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawPlan = safeStr(url.searchParams.get("plan")).trim().toLowerCase();
    const rawFile = safeStr(url.searchParams.get("file")).trim();

    const folder = PLAN_FOLDER_MAP[rawPlan];
    if (!folder) {
      return NextResponse.json(
        { error: `Invalid plan: ${rawPlan || "(empty)"}` },
        { status: 400 }
      );
    }

    if (isBadPath(rawFile)) {
      return NextResponse.json(
        { error: "Invalid or missing file path." },
        { status: 400 }
      );
    }

    const encodedFilePath = encodePathKeepSlash(rawFile);
    const assetUrl = new URL(`/downloads/${folder}/${encodedFilePath}`, url.origin);

    const assetRes = await fetch(assetUrl.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });

    if (!assetRes.ok || !assetRes.body) {
      return NextResponse.json(
        {
          error: `Asset not found: ${folder}/${rawFile}`,
          status: assetRes.status,
        },
        { status: 404 }
      );
    }

    const fileName = rawFile.split("/").pop() || "download";
    const headers = new Headers();

    headers.set(
      "Content-Type",
      assetRes.headers.get("Content-Type") || "application/octet-stream"
    );
    headers.set("Content-Disposition", contentDisposition(fileName));
    headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    headers.set("X-Content-Type-Options", "nosniff");

    const contentLength = assetRes.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(assetRes.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Download failed" },
      { status: 500 }
    );
  }
}