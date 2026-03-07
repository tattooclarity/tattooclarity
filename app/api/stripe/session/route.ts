import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 400 }
      );
    }

    // ✅ Cloudflare-safe Stripe client
    const stripe = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = (await req.json().catch(() => ({}))) as any;
    const session_id =
      typeof body?.session_id === "string" ? body.session_id.trim() : "";

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const email =
      session.customer_details?.email || session.customer_email || null;

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

    const normalizedProvince = stripeState || metaProvince;
    const isQuebecOrder =
      isCanadaOrder && ["qc", "quebec", "québec"].includes(normalizedProvince);

    const paid = session.payment_status === "paid" && !isQuebecOrder;

    return NextResponse.json({
      paid,
      email,
      session_id: session.id,
      purchased_at: session.created ? session.created * 1000 : 0,
      quebec_blocked: isQuebecOrder,
      amount_total: session.amount_total || 0,
      currency: session.currency || "usd",
      metadata: {
        ...(session.metadata || {}),
        customer_country:
          stripeCountry || session.metadata?.customer_country || "",
        customer_province:
          stripeState || session.metadata?.customer_province || "",
      },
    });
  } catch (err: any) {
    console.error("Stripe session retrieve error:", err);
    return NextResponse.json(
      { error: err?.message || "Error" },
      { status: 500 }
    );
  }
}