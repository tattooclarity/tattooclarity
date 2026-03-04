// app/api/order/verify/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_SECRET_KEY" },
        { status: 400 }
      );
    }

    // ✅ 解法 B：cast 走 TS 紅線（或你可以直接刪 apiVersion）
    const stripe = new Stripe(key, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    });

    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id") || "";

    if (!orderId || !orderId.startsWith("cs_")) {
      return NextResponse.json(
        { ok: false, error: "Invalid or missing order_id." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(orderId);

    const paid = session.payment_status === "paid";
    const purchased_at = (session.created || 0) * 1000; // seconds -> ms
    const md = (session.metadata || {}) as Record<string, string>;

    return NextResponse.json(
      {
        ok: true,
        paid,
        order_id: orderId,
        purchased_at,
        metadata: md,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}