// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

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
      
    });

    const body = (await req.json().catch(() => ({}))) as any;

    const planRaw = ((body?.plan as string) || "standard").toLowerCase();
    const bundleRaw = ((body?.bundle as string) || "single").toLowerCase();

    const plan: Plan = (["basic", "standard", "premium", "mystery"].includes(planRaw)
      ? planRaw
      : "standard") as Plan;

    const bundle: Bundle = bundleRaw === "duo" ? "duo" : "single";

    // ✅ 只允許 Standard/Premium 用 DUO；其他一律降回 single
    const duoAllowed = bundle === "duo" && (plan === "standard" || plan === "premium");
    const finalBundle: Bundle = duoAllowed ? "duo" : "single";

    // ✅ 重要：Download 會靠 metadata 決定要派咩檔
    // 你 Customize page 送咩過嚟，就儘量存低（無就留空字串）
    const theme = typeof body?.theme === "string" ? body.theme : ""; // e.g. "dragon"
    const label = typeof body?.label === "string" ? body.label : ""; // e.g. "flying"
    const lang = typeof body?.lang === "string" ? body.lang : ""; // "tc" | "sc"
    const style = typeof body?.style === "string" ? body.style : ""; // "SA" | "SB" | "SC"
    const type = typeof body?.type === "string" ? body.type : ""; // "single" | "phrase"

    const baseUrl = getBaseUrl(req);

    const successUrl =
      `${baseUrl}/success?plan=${encodeURIComponent(plan)}` +
      `&bundle=${encodeURIComponent(finalBundle)}` +
      `&order_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = `${baseUrl}/customize?plan=${encodeURIComponent(plan)}&canceled=1`;

    const lineItem =
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

    if (finalBundle === "duo" && !DUO_USD[plan]) {
      return NextResponse.json(
        { error: "DUO price not configured for this plan." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_creation: "if_required",
      line_items: [lineItem as Stripe.Checkout.SessionCreateParams.LineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,

      // ✅ Download / Verify 會用呢堆
      metadata: {
        plan,
        bundle: finalBundle,
        theme,
        label,
        lang,
        style,
        type,
      },
    });

    return NextResponse.json({ url: session.url, id: session.id }, { status: 200 });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}