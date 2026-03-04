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
  basic: "price_1T6zEm8ibVtR5keHigRfsfSn",
  standard: "price_1T6yzG8ibVtR5keHaYKudoTW",
  premium: "price_1T6zFx8ibVtR5keH6CS5Qsu1",
  mystery: "price_1T6zJV8ibVtR5keHmbWQzzRe",
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

// ✅ 隨機抽圖函數
function pickMysteryFile(): string | null {
  try {
    const manifestPath = path.join(process.cwd(), "storage", "manifests", "mystery_pool.json");
    if (!fs.existsSync(manifestPath)) return null;

    const raw = fs.readFileSync(manifestPath, "utf-8");
    const data = JSON.parse(raw);
    const files = data.files || [];

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
    if (!key) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 400 });

    // ✅ A方案重點：用 Checkout Session 之後用 session_id 去 Stripe 取 email
    const stripe = new Stripe(key) ;

    const body = (await req.json().catch(() => ({}))) as any;

    const planRaw = safeStr(body?.plan || "standard").toLowerCase();
    const bundleRaw = safeStr(body?.bundle || "single").toLowerCase();
    const plan: Plan = (["basic", "standard", "premium", "mystery"].includes(planRaw) ? planRaw : "standard") as Plan;
    const bundle: Bundle = bundleRaw === "duo" ? "duo" : "single";

    // Mystery 不支援 Duo
    const finalBundle: Bundle = bundle === "duo" && plan !== "mystery" ? "duo" : "single";

    // 讀取前端傳來的資料
    const theme = safeStr(body?.theme);
    const label = safeStr(body?.label);
    const lang = safeStr(body?.lang);
    const style = safeStr(body?.style);

    // Duo 第二組資料
    const theme2 = finalBundle === "duo" ? safeStr(body?.theme2) : "";
    const label2 = finalBundle === "duo" ? safeStr(body?.label2) : "";
    const lang2 = finalBundle === "duo" ? safeStr(body?.lang2) : "";
    const style2 = finalBundle === "duo" ? safeStr(body?.style2) : "";

    const baseUrl = getBaseUrl(req);

    // ✅ 改呢行：success_url 只傳 session_id（Stripe 會自動塞入）
    //    之後你喺 /success 或 /download 用 session_id call 你自己 API -> retrieve session -> customer_details.email
    const successUrl = `${baseUrl}/success?plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = `${baseUrl}/customize?plan=${encodeURIComponent(plan)}&canceled=1`;

    // 計算價格
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

    // ✅ Mystery 核心邏輯：在這裡抽圖！
    let mysteryFile = "";
    if (plan === "mystery") {
      const picked = pickMysteryFile();
      mysteryFile = picked || "mystery_mystery_MYSTERY.png";
    }

    // 建立 Stripe Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // payment_method_types 其實可省略（Stripe 會自動），但保留都OK
      payment_method_types: ["card"],
      line_items: [priceData],

      success_url: successUrl,
      cancel_url: cancelUrl,

      // ✅ 你原本 metadata 保留：用嚟 download 對應檔案
      metadata: {
        plan,
        bundle: finalBundle,

        theme: plan === "mystery" ? "mystery" : theme,
        label: plan === "mystery" ? "mystery" : label,
        lang: plan === "mystery" ? "mystery" : lang,
        style: plan === "mystery" ? "mystery" : style,

        theme2,
        label2,
        lang2,
        style2,

        mystery_file: mysteryFile,
        mystery_planFolder: "mystery_png",
      },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}