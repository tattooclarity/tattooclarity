import { NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// 真實檔案位置：storage/designs/<plan>/<file>
const DESIGNS_ROOT = path.join(process.cwd(), "storage", "designs");

// 只允許這些 plan 資料夾
const ALLOWED_PLANS = new Set([
  "basic_png",
  "standard",
  "premium_png",
  "premium_svg",
  "mystery_png",
  "mystery_svg",
]);

function safeJoin(baseDir: string, subPath: string) {
  const normalized = subPath.replace(/^\/+/, "");
  const full = path.join(baseDir, normalized);
  const rel = path.relative(baseDir, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return full;
}

function contentTypeByExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml; charset=utf-8";
  if (ext === ".zip") return "application/zip";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

// 舊版 mystery fallback：manifest 第一個
function pickMysteryByOrderId(): string | null {
  try {
    const manifestPath = path.join(
      process.cwd(),
      "storage",
      "manifests",
      "mystery_pool.json"
    );
    if (!fs.existsSync(manifestPath)) return null;

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const data = JSON.parse(raw);
    const files: string[] = Array.isArray(data?.files) ? data.files : [];

    if (!files.length) return null;
    return files[0] || null;
  } catch {
    return null;
  }
}

// 用 orderId 固定抽一張 mystery
function pickMysteryDeterministic(orderId: string): string | null {
  try {
    const manifestPath = path.join(
      process.cwd(),
      "storage",
      "manifests",
      "mystery_pool.json"
    );
    if (!fs.existsSync(manifestPath)) return null;

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const data = JSON.parse(raw);
    const files: string[] = Array.isArray(data?.files) ? data.files : [];

    if (!files.length) return null;

    const hash = crypto.createHash("sha256").update(orderId).digest();
    const num = hash.readUInt32BE(0);
    const idx = num % files.length;

    return files[idx] || files[0] || null;
  } catch {
    return null;
  }
}

async function verifyStripeSessionIfPresent(orderId: string) {
  if (!orderId || !orderId.startsWith("cs_")) return;

  const session = await stripe.checkout.sessions.retrieve(orderId);

  if (session.payment_status !== "paid") {
    throw new Error("ORDER_NOT_PAID");
  }

  const metaCountry = (session.metadata?.customer_country || "")
    .trim()
    .toLowerCase();
  const metaProvince = (session.metadata?.customer_province || "")
    .trim()
    .toLowerCase();
  const stripeCountry = (session.customer_details?.address?.country || "")
    .trim()
    .toLowerCase();
  const stripeState = (session.customer_details?.address?.state || "")
    .trim()
    .toLowerCase();

  const isCanadaOrder =
    ["canada", "ca"].includes(metaCountry) ||
    ["canada", "ca"].includes(stripeCountry);

  // 用 Stripe 最後付款地址優先
  const normalizedProvince = stripeState || metaProvince;
  const isQuebecOrder =
    isCanadaOrder && ["qc", "quebec", "québec"].includes(normalizedProvince);

  if (isQuebecOrder) {
    throw new Error("QUEBEC_BLOCKED");
  }
}

// Plan 資料夾 fallback
function getCandidatePlanDirs(plan: string): string[] {
  switch (plan) {
    case "basic_png":
      return ["basic_png"];
    case "standard":
      return ["standard", "standard_png"];
    case "premium_png":
      return ["premium_png", "premium"];
    case "premium_svg":
      return ["premium_svg"];
    case "mystery_png":
      return ["mystery_png"];
    case "mystery_svg":
      return ["mystery_svg"];
    default:
      return [plan];
  }
}

// 產生檔名候選列表
function generateFallbackNames(originalName: string): string[] {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  const candidates = new Set<string>();
  candidates.add(originalName);

  // style：例如 _SA / _SB / _SC
  const styleMatch = base.match(/_(S[A-Z])$/);
  const style = styleMatch ? styleMatch[1] : null;
  const baseNoStyle = styleMatch
    ? base.slice(0, -(styleMatch[1].length + 1))
    : base;

  // lang：例如 _tc / _sc
  const langMatch = baseNoStyle.match(/_([a-z]{2,3})$/);
  const lang = langMatch ? langMatch[1] : null;
  const themePart = langMatch
    ? baseNoStyle.slice(0, -(langMatch[1].length + 1))
    : baseNoStyle;

  let hasPhrase = false;
  let cleanTheme = themePart;

  if (themePart.endsWith("_phrase")) {
    hasPhrase = true;
    cleanTheme = themePart.slice(0, -7);
  }

  if (style && lang) {
    const toggledTheme = hasPhrase ? cleanTheme : `${cleanTheme}_phrase`;

    // single / phrase 切換
    candidates.add(`${toggledTheme}_${lang}_${style}${ext}`);

    // style 切換
    const styles = ["SA", "SB", "SC"];

    for (const s of styles) {
      if (s !== style) {
        candidates.add(`${themePart}_${lang}_${s}${ext}`);
      }
    }

    // phrase + style 切換
    for (const s of styles) {
      if (s !== style) {
        candidates.add(`${toggledTheme}_${lang}_${s}${ext}`);
      }
    }
  }

  return Array.from(candidates);
}

// 尋找最佳現有檔案
function findBestExistingFile(
  plan: string,
  requestedFile: string
): { fullPath: string; resolvedPlan: string } | null {
  const candidatePlans = getCandidatePlanDirs(plan);
  const dirName = path.dirname(requestedFile);
  const fileName = path.basename(requestedFile);
  const candidateNames = generateFallbackNames(fileName);

  for (const candidatePlan of candidatePlans) {
    const baseDir = path.join(DESIGNS_ROOT, candidatePlan);

    for (const candidateName of candidateNames) {
      const subPath =
        dirName === "." ? candidateName : `${dirName}/${candidateName}`;
      const fullPath = safeJoin(baseDir, subPath);

      if (fullPath && fs.existsSync(fullPath)) {
        return { fullPath, resolvedPlan: candidatePlan };
      }
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const plan = (url.searchParams.get("plan") || "").trim();
    const file = (url.searchParams.get("file") || "").trim();
    const orderId = (
      url.searchParams.get("order_id") ||
      url.searchParams.get("session_id") ||
      ""
    ).trim();

    if (!plan) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    // 如有 Stripe session id，驗證 paid + Québec block
    if (orderId.startsWith("cs_")) {
      try {
        await verifyStripeSessionIfPresent(orderId);
      } catch (err: any) {
        if (err?.message === "ORDER_NOT_PAID") {
          return NextResponse.json(
            { error: "Order is not paid" },
            { status: 403 }
          );
        }

        if (err?.message === "QUEBEC_BLOCKED") {
          return NextResponse.json(
            { error: "This download is not available in Québec." },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { error: "Failed to verify Stripe session" },
          { status: 500 }
        );
      }
    }

    // 舊 mystery fallback：/api/download?plan=mystery&order_id=...
    if (plan === "mystery") {
      if (!orderId) {
        return NextResponse.json(
          { error: "Missing order_id for mystery" },
          { status: 400 }
        );
      }

      const picked =
        pickMysteryDeterministic(orderId) || pickMysteryByOrderId();

      if (!picked) {
        return NextResponse.json(
          { error: "Mystery pool is empty" },
          { status: 404 }
        );
      }

      const baseDir = path.join(DESIGNS_ROOT, "mystery_png");
      const fullPath = safeJoin(baseDir, picked);

      if (!fullPath) {
        return NextResponse.json(
          { error: "Invalid mystery file path" },
          { status: 400 }
        );
      }

      if (!fs.existsSync(fullPath)) {
        return NextResponse.json(
          {
            error: "File not found on server",
            details: `Target: mystery_png/${picked}`,
          },
          { status: 404 }
        );
      }

      const buf = fs.readFileSync(fullPath);

      return new NextResponse(buf, {
        headers: {
          "Content-Type": contentTypeByExt(fullPath),
          "Content-Disposition": `attachment; filename="${path.basename(
            fullPath
          )}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (!ALLOWED_PLANS.has(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // 套用 server-side fallback 尋找檔案
    const match = findBestExistingFile(plan, file);

    if (!match) {
      return NextResponse.json(
        {
          error: "File not found on server",
          details: `Target: ${plan}/${file}`,
        },
        { status: 404 }
      );
    }

    const { fullPath } = match;
    const buf = fs.readFileSync(fullPath);

    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentTypeByExt(fullPath),
        "Content-Disposition": `attachment; filename="${path.basename(
          fullPath
        )}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Download error" },
      { status: 500 }
    );
  }
}