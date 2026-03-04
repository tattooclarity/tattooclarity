import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 400 });

    const stripe = new Stripe(key);

    const body = (await req.json().catch(() => ({}))) as any;
    const session_id = typeof body?.session_id === "string" ? body.session_id : "";

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const email = session.customer_details?.email || session.customer_email || null;
    const paid = session.payment_status === "paid";

    return NextResponse.json({ paid, email, session_id: session.id, metadata: session.metadata || {} });
  } catch (err: any) {
    console.error("Stripe session retrieve error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}