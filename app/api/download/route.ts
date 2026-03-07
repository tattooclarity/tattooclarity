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

    const target = new URL(
      `/downloads/${folder}/${rawFile.replace(/^\/+/, "")}`,
      url.origin
    );

    return NextResponse.redirect(target, 302);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Download redirect failed" },
      { status: 500 }
    );
  }
}