// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return "http://localhost:3000";
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!secret || !stripeKey || !resendKey || !from) {
    return NextResponse.json(
      { error: "Missing env: STRIPE_WEBHOOK_SECRET / STRIPE_SECRET_KEY / RESEND_API_KEY / RESEND_FROM" },
      { status: 500 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verify failed: ${err?.message}` }, { status: 400 });
  }

  // ✅ 付款成功：checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      undefined;

    const plan = (session.metadata?.plan || "standard").toLowerCase();
    const orderId = session.id; // 例如 cs_test_xxx

    if (email) {
      const baseUrl = getBaseUrl();
      const downloadUrl = `${baseUrl}/download?order_id=${encodeURIComponent(orderId)}&plan=${encodeURIComponent(plan)}`;

      const resend = new Resend(resendKey);

      await resend.emails.send({
        from,
        to: email,
        subject: "Your Tattoo Files Are Ready",
        html: `
          <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Arial; line-height:1.6;">
            <h2 style="margin:0 0 10px;">Download Ready ✅</h2>
            <p style="margin:0 0 14px;">Thanks for your purchase. Click below to download your files.</p>
            <p style="margin:0 0 16px;">
              <a href="${downloadUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#caa34a;color:#111;text-decoration:none;font-weight:800;">
                Go to Download
              </a>
            </p>
            <p style="margin:0;color:#666;font-size:12px;">
              Order: ${orderId}<br/>Plan: ${plan}
            </p>
          </div>
        `,
      });
    }
  }

  return NextResponse.json({ received: true });
}