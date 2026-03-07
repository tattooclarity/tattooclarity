// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

type Plan = "basic" | "standard" | "premium" | "mystery";
type Bundle = "single" | "duo";

const PRICE_ID: Record<Plan, string> = {
  basic: "price_1T89rw8yI8oL3SNLMwBZKoe9",
  standard: "price_1T89rp8yI8oL3SNLJgMTRE2y",
  premium: "price_1T89s28yI8oL3SNLyFdyHP3i",
  mystery: "price_1T89bC8yI8oL3SNLqmnUsmLC",
};

const DUO_USD: Partial<Record<Plan, number>> = {
  standard: 50,
  premium: 78,
};

function getBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return `${proto}://${host}`;
}

function safeStr(v: any, maxLen = 180) {
  const s = typeof v === "string" ? v : "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

// ✅ light email sanity check
function normalizeEmail(v: any) {
  const e = safeStr(v, 254).trim().toLowerCase();
  if (!e) return "";
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  return ok ? e : "";
}

/**
 * ✅ 方案A：直接從 storage/designs/mystery_png 隨機抽一張 PNG
 */
function pickMysteryFile(): string | null {
  try {
    const dir = path.join(process.cwd(), "storage", "designs", "mystery_png");
    if (!fs.existsSync(dir)) return null;

    const files = fs
      .readdirSync(dir)
      .filter((f) => typeof f === "string" && f.toLowerCase().endsWith(".png"))
      .filter((f) => !f.startsWith("."));

    if (files.length === 0) return null;

    const idx = crypto.randomInt(0, files.length);
    return files[idx];
  } catch (e) {
    console.error("Pick mystery file error:", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 400 }
      );
    }

    // ✅ Stripe client
    const stripe = new Stripe(key);

    const body = (await req.json().catch(() => ({}))) as any;

    const planRaw = safeStr(body?.plan || "standard").toLowerCase();
    const bundleRaw = safeStr(body?.bundle || "single").toLowerCase();

    const plan: Plan = (["basic", "standard", "premium", "mystery"].includes(planRaw)
      ? planRaw
      : "standard") as Plan;

    const bundle: Bundle = bundleRaw === "duo" ? "duo" : "single";

    // ✅ Optional email from frontend (receipt insurance)
    const customerEmail = normalizeEmail(body?.email);

    const customerCountry = safeStr(body?.customerCountry, 80).trim();
    const customerProvince = safeStr(body?.customerProvince, 80).trim();

    const normalizedCountry = customerCountry.toLowerCase();
    const normalizedProvince = customerProvince.toLowerCase();
    const isCanada = normalizedCountry === "canada";
    const isQuebecBlocked =
      isCanada && ["qc", "quebec", "québec"].includes(normalizedProvince);
    const missingProvince = isCanada && !customerProvince;

    // Mystery 不支援 Duo
    const finalBundle: Bundle =
      bundle === "duo" && plan !== "mystery" ? "duo" : "single";

    if (missingProvince) {
      return NextResponse.json(
        {
          error: "Please select a province to continue.",
        },
        { status: 400 }
      );
    }

    if (isQuebecBlocked) {
      return NextResponse.json(
        {
          error:
            "This service is not currently available to customers located in Québec.",
        },
        { status: 403 }
      );
    }

    // 讀取前端傳來的資料（Set 1）
    const theme = safeStr(body?.theme);
    const label = safeStr(body?.label);
    const lang = safeStr(body?.lang);
    const style = safeStr(body?.style);

    // ✅ type（single / phrase）
    const type = safeStr(body?.type || "single").toLowerCase();

    // Set 2（Duo）
    const theme2 = finalBundle === "duo" ? safeStr(body?.theme2) : "";
    const label2 = finalBundle === "duo" ? safeStr(body?.label2) : "";
    const lang2 = finalBundle === "duo" ? safeStr(body?.lang2) : "";
    const style2 = finalBundle === "duo" ? safeStr(body?.style2) : "";
    const type2 = finalBundle === "duo" ? safeStr(body?.type2 || "single").toLowerCase() : "";

    const baseUrl = getBaseUrl(req);

    const successUrl = `${baseUrl}/success?plan=${encodeURIComponent(
      plan
    )}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/customize?plan=${encodeURIComponent(
      plan
    )}&canceled=1`;

    // 計算價格 line_item
    let priceData: Stripe.Checkout.SessionCreateParams.LineItem;

    if (finalBundle === "duo" && DUO_USD[plan]) {
      priceData = {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(DUO_USD[plan]! * 100),
          product_data: {
            name: `Tattoo Clarity – ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (DUO)`,
            description: "2 sets included.",
          },
        },
      };
    } else {
      priceData = { price: PRICE_ID[plan], quantity: 1 };
    }

    // ✅ Mystery：付款前就抽好，並鎖定到 metadata
    let mysteryFile = "";
    if (plan === "mystery") {
      const picked = pickMysteryFile();
      mysteryFile = picked || "mystery_mystery_MYSTERY.png";
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      billing_address_collection: "required",

      /**
       * ✅ 只用 card（但 card 會自動包含 Apple Pay / Google Pay / Link）
       * 前提：你已喺 Stripe Dashboard 啟用 Apple Pay / Google Pay（你而家已經開咗 ✅）
       * 這樣就唔會自動加埋 Klarna / Bancontact 呢類額外方法。
       */
      payment_method_types: ["card"],

      line_items: [priceData],
        // Promotion codes disabled
allow_promotion_codes: false,
      success_url: successUrl,
      cancel_url: cancelUrl,

      ...(customerEmail
        ? {
            customer_email: customerEmail,
            payment_intent_data: {
              receipt_email: customerEmail,
            },
          }
        : {}),

      metadata: {
        plan,
        bundle: finalBundle,

        // ✅ 重要：存 type/type2，download page 先會正確加 "_phrase"
        type: plan === "mystery" ? "single" : type,
        type2: plan === "mystery" ? "" : type2,

        theme: plan === "mystery" ? "mystery" : theme,
        label: plan === "mystery" ? "mystery" : label,
        lang: plan === "mystery" ? "mystery" : lang,
        style: plan === "mystery" ? "mystery" : style,

        theme2,
        label2,
        lang2,
        style2,

        customer_country: customerCountry || "",
        customer_province: customerProvince || "",

        // ✅ 鎖定抽到的檔名
        mystery_file: mysteryFile,
        mystery_planFolder: "mystery_png",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err?.message || "Error" },
      { status: 500 }
    );
  }
}