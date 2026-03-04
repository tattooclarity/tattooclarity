// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs";

// ✅ 不設定 apiVersion，避免 TS 紅線 / 版本不一致問題
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const resend = new Resend(process.env.RESEND_API_KEY || "");

// ---- helpers ----
function trimSlash(u: string) {
  return u.replace(/\/$/, "");
}

function getBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return trimSlash(envUrl);

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return trimSlash(`${proto}://${host}`);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mustEnv(name: string, v: string | undefined | null) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const webhookSecret = mustEnv("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
    mustEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
    mustEnv("RESEND_API_KEY", process.env.RESEND_API_KEY);
    const from = mustEnv("EMAIL_FROM", process.env.EMAIL_FROM);

    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Webhook signature verify failed: ${err?.message || "invalid signature"}` },
        { status: 400 }
      );
    }

    // ✅ 只處理 checkout.session.completed
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_details?.email || session.customer_email || "";
    if (!email) return NextResponse.json({ received: true, skipped: "no_email" });

    const plan = (session.metadata?.plan || "standard").toLowerCase();
    const sessionId = session.id;

    const baseUrl = getBaseUrl(req);

    // ✅ download 已支援：session_id / order_id 都可以
    const downloadUrl =
      `${baseUrl}/download?session_id=${encodeURIComponent(sessionId)}` +
      `&order_id=${encodeURIComponent(sessionId)}` +
      `&plan=${encodeURIComponent(plan)}`;

    const safeDownloadUrl = escapeHtml(downloadUrl);

    await resend.emails.send({
      from,
      to: email,
      subject: "Your Tattoo Files Are Ready ✅",
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Arial, sans-serif; line-height:1.6; color:#111;">
          <h2 style="margin:0 0 10px;">Download Ready ✅</h2>
          <p style="margin:0 0 14px;">Thanks for your purchase. Click below to download your files.</p>

          <p style="margin:0 0 16px;">
            <a href="${safeDownloadUrl}"
              style="display:inline-block;padding:12px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:800;">
              Go to Download
            </a>
          </p>

          <p style="margin:0 0 10px;color:#666;font-size:12px;">
            If the button doesn't work, copy & paste this link:
          </p>
          <p style="margin:0 0 16px;font-size:12px;word-break:break-all;">
            ${safeDownloadUrl}
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
          <p style="margin:0;color:#666;font-size:12px;">
            Order: ${escapeHtml(sessionId)}<br/>
            Plan: ${escapeHtml(plan)}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ received: true, emailed: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err?.message || "Webhook error" }, { status: 500 });
  }
}