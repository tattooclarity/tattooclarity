// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

type Plan = "basic" | "standard" | "premium" | "mystery";
type Bundle = "single" | "duo";

/**
 * ✅ Stripe Price IDs（單買）
 */
const PRICE_ID: Record<Plan, string> = {
  basic: "price_1T6zEm8ibVtR5keHigRfsfSn",
  standard: "price_1T6yzG8ibVtR5keHaYKudoTW",
  premium: "price_1T6zFx8ibVtR5keH6CS5Qsu1",
  mystery: "price_1T6zJV8ibVtR5keHmbWQzzRe",
};

/**
 * ✅ DUO 價錢（USD）
 */
const DUO_USD: Partial<Record<Plan, number>> = {
  standard: 50,
  premium: 78,
};

function getBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.headers.get("host")?.includes("localhost") ? "http" : "https");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");

  if (!host) {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  }
  return `${proto}://${host}`;
}

function safeStr(v: any, maxLen = 180) {
  const s = typeof v === "string" ? v : "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/**
 * ✅ Mystery：從 manifest random 抽一個 standard_png 檔案
 * 返還：例如 "love/love_phrase_tc_SA.png"
 */
function pickMysteryFileFromManifest(): string | null {
  try {
    const manifestPath = path.join(
      process.cwd(),
      "storage",
      "manifests",
      "mystery_pool_standard_png.json"
    );

    if (!fs.existsSync(manifestPath)) return null;

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(raw) as { files?: string[] };

    const files = Array.isArray(parsed?.files) ? parsed.files : [];
    if (!files.length) return null;

    // crypto.randomInt is secure & available in node
    const idx = crypto.randomInt(0, files.length);
    const f = String(files[idx] || "").trim();

    // basic security
    if (!f || f.includes("..") || f.includes("\\") || f.startsWith("/")) return null;
    if (!f.toLowerCase().endsWith(".png")) return null;

    return f;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY in env." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(key, {
      // apiVersion: "2024-06-20",
    });

    const body = (await req.json().catch(() => ({}))) as any;

    const planRaw = safeStr(body?.plan || "standard").toLowerCase();
    const bundleRaw = safeStr(body?.bundle || "single").toLowerCase();

    const plan: Plan = (["basic", "standard", "premium", "mystery"].includes(planRaw)
      ? planRaw
      : "standard") as Plan;

    const bundle: Bundle = bundleRaw === "duo" ? "duo" : "single";

    // ✅ 只允許 Standard/Premium 用 DUO；其他一律降回 single
    const duoAllowed = bundle === "duo" && (plan === "standard" || plan === "premium");

    // ✅ DUO 必須真係有第二份 metadata，否則降回 single
    const hasSecondPick =
      typeof body?.theme2 === "string" &&
      typeof body?.label2 === "string" &&
      String(body.theme2).trim() !== "" &&
      String(body.label2).trim() !== "";

    const finalBundle: Bundle = duoAllowed && hasSecondPick ? "duo" : "single";

    // ✅ 第一份 metadata
    const theme = safeStr(body?.theme);
    const label = safeStr(body?.label);
    const lang = safeStr(body?.lang);
    const style = safeStr(body?.style);
    const styleLetter = safeStr(body?.styleLetter);
    const fontId = safeStr(body?.fontId);
    const type = safeStr(body?.type);

    // ✅ 第二份（DUO）
    const theme2 = finalBundle === "duo" ? safeStr(body?.theme2) : "";
    const label2 = finalBundle === "duo" ? safeStr(body?.label2) : "";
    const lang2 = finalBundle === "duo" ? safeStr(body?.lang2) : "";
    const style2 = finalBundle === "duo" ? safeStr(body?.style2) : "";
    const styleLetter2 = finalBundle === "duo" ? safeStr(body?.styleLetter2) : "";
    const fontId2 = finalBundle === "duo" ? safeStr(body?.fontId2) : "";
    const type2 = finalBundle === "duo" ? safeStr(body?.type2) : "";

    // ✅ optional debug fields
    const layout = safeStr(body?.layout, 60);
    const char = safeStr(body?.char, 260);
    const priceShown = safeStr(String(body?.priceShown ?? ""), 30);

    const baseUrl = getBaseUrl(req);

    const successUrl =
      `${baseUrl}/success?plan=${encodeURIComponent(plan)}` +
      `&bundle=${encodeURIComponent(finalBundle)}` +
      `&order_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      `${baseUrl}/customize?plan=${encodeURIComponent(plan)}` +
      `&canceled=1`;

    // ✅ Line item
    if (finalBundle === "duo" && !DUO_USD[plan]) {
      return NextResponse.json(
        { error: "DUO price not configured for this plan." },
        { status: 400 }
      );
    }

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
      finalBundle === "single"
        ? { price: PRICE_ID[plan], quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: Math.round((DUO_USD[plan] || 0) * 100),
              product_data: {
                name:
                  plan === "standard"
                    ? "Tattoo Clarity – Standard Plan (DUO)"
                    : "Tattoo Clarity – Premium Plan (DUO)",
                description:
                  plan === "premium"
                    ? "2 sets (up to 4 characters). Includes PNG + SVG."
                    : "2 sets (up to 4 characters). Includes PNG.",
              },
            },
          };

    // ✅ guard unit_amount
    if (
      finalBundle === "duo" &&
      (lineItem as any)?.price_data?.unit_amount &&
      (lineItem as any).price_data.unit_amount <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid DUO unit_amount. Check DUO_USD config." },
        { status: 400 }
      );
    }

    const isMystery = plan === "mystery";

    // ✅ Mystery Random: 抽一張 standard_png 檔
    const mysteryPicked = isMystery ? pickMysteryFileFromManifest() : null;

    // ✅ fallback file（你而家救火固定檔）
    const mysteryFallback = "mystery/mystery_mystery_MYSTERY.png";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_creation: "if_required",
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,

      metadata: {
        plan,
        bundle: finalBundle,

        // First pick
        theme: isMystery ? "mystery" : theme,
        label: isMystery ? "mystery" : label,
        lang: isMystery ? "mystery" : lang,
        style: isMystery ? "mystery" : style,
        styleLetter: isMystery ? "mystery" : styleLetter,
        fontId: isMystery ? "mystery" : fontId,
        type: isMystery ? "mystery" : type,

        // Second pick (duo only)
        theme2: finalBundle === "duo" && !isMystery ? theme2 : "",
        label2: finalBundle === "duo" && !isMystery ? label2 : "",
        lang2: finalBundle === "duo" && !isMystery ? lang2 : "",
        style2: finalBundle === "duo" && !isMystery ? style2 : "",
        styleLetter2: finalBundle === "duo" && !isMystery ? styleLetter2 : "",
        fontId2: finalBundle === "duo" && !isMystery ? fontId2 : "",
        type2: finalBundle === "duo" && !isMystery ? type2 : "",

        // ✅ Mystery delivery fields (IMPORTANT)
        // download 端只要讀呢兩個就可以派檔
        mystery_planFolder: isMystery ? "standard_png" : "",
        mystery_file: isMystery ? (mysteryPicked || mysteryFallback) : "",

        // Optional debug fields
        layout,
        char,
        priceShown,
      },
    });

    return NextResponse.json({ url: session.url, id: session.id }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}