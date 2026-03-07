// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// ---- helpers ----
function trimSlash(u: string) {
  return u.replace(/\/$/, "");
}

function getBaseUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return trimSlash(envUrl);

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";
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

// ✅ 不要在檔案頂層直接 new Stripe / new Resend
//    Cloudflare build 時可能未有 env，會直接爆
function getStripe() {
  const key = mustEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  return new Stripe(key);
}

function getResend() {
  const key = mustEnv("RESEND_API_KEY", process.env.RESEND_API_KEY);
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    const webhookSecret = mustEnv(
      "STRIPE_WEBHOOK_SECRET",
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // ✅ 兼容你之前兩種命名：RESEND_FROM / EMAIL_FROM
    const from = mustEnv(
      "RESEND_FROM or EMAIL_FROM",
      process.env.RESEND_FROM || process.env.EMAIL_FROM
    );

    const stripe = getStripe();
    const resend = getResend();

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature" },
        { status: 400 }
      );
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Webhook signature verify failed: ${
            err?.message || "invalid signature"
          }`,
        },
        { status: 400 }
      );
    }

    // ✅ 只處理 checkout.session.completed
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      "";

    if (!email) {
      return NextResponse.json({
        received: true,
        skipped: "no_email",
      });
    }

    // ✅ Québec Safety Check
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

    const normalizedProvince = metaProvince || stripeState;
    const isQuebecOrder =
      isCanadaOrder &&
      ["qc", "quebec", "québec"].includes(normalizedProvince);

    if (isQuebecOrder) {
      return NextResponse.json({
        received: true,
        skipped: "quebec_blocked",
      });
    }

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
    return NextResponse.json(
      { error: err?.message || "Webhook error" },
      { status: 500 }
    );
  }
}