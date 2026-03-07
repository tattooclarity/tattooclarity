import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

type Plan = "basic" | "standard" | "premium" | "mystery";

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

function getStripe() {
  const key = mustEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

function getResend() {
  const key = mustEnv("RESEND_API_KEY", process.env.RESEND_API_KEY);
  return new Resend(key);
}

function planDays(plan: Plan) {
  if (plan === "premium") return 45;
  if (plan === "standard" || plan === "mystery") return 30;
  return 15;
}

function addDays(startMs: number, days: number) {
  return startMs + days * 24 * 60 * 60 * 1000;
}

export async function POST(req: Request) {
  try {
    const adminKey = mustEnv("ADMIN_RESEND_KEY", process.env.ADMIN_RESEND_KEY);
    const providedKey = req.headers.get("x-admin-key") || "";

    if (providedKey !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();
    const resend = getResend();

    const from = mustEnv(
      "RESEND_FROM or EMAIL_FROM",
      process.env.RESEND_FROM || process.env.EMAIL_FROM
    );

    const body = (await req.json().catch(() => ({}))) as {
      session_id?: string;
      override_email?: string;
    };

    const sessionId = (body.session_id || "").trim();
    const overrideEmail = (body.override_email || "").trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paymentStatus = session.payment_status || "";
    if (paymentStatus !== "paid") {
      return NextResponse.json(
        { error: `Session not paid: ${paymentStatus || "unknown"}` },
        { status: 400 }
      );
    }

    const email =
      overrideEmail ||
      session.customer_details?.email ||
      session.customer_email ||
      "";

    if (!email) {
      return NextResponse.json(
        { error: "No customer email found" },
        { status: 400 }
      );
    }

    const plan = ((session.metadata?.plan || "standard").toLowerCase() as Plan);
    const purchasedAtMs = session.created ? session.created * 1000 : 0;

    if (!purchasedAtMs) {
      return NextResponse.json(
        { error: "Missing purchase time" },
        { status: 400 }
      );
    }

    const expiresAtMs = addDays(purchasedAtMs, planDays(plan));
    const now = Date.now();

    if (now > expiresAtMs) {
      return NextResponse.json(
        {
          error: "Download period expired",
          expired_at: expiresAtMs,
        },
        { status: 400 }
      );
    }

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
      isCanadaOrder &&
      ["qc", "quebec", "québec"].includes(normalizedProvince);

    if (isQuebecOrder) {
      return NextResponse.json(
        { error: "Québec orders are blocked" },
        { status: 403 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const bundle = session.metadata?.bundle || "single";

    const downloadUrl =
      `${baseUrl}/download?session_id=${encodeURIComponent(session.id)}` +
      `&order_id=${encodeURIComponent(session.id)}` +
      `&plan=${encodeURIComponent(plan)}` +
      `&bundle=${encodeURIComponent(bundle)}`;

    const safeDownloadUrl = escapeHtml(downloadUrl);

    const sendResult = await resend.emails.send({
      from,
      to: email,
      subject: "Your Tattoo Files Are Ready ✅",
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Arial, sans-serif; line-height:1.6; color:#111;">
          <h2 style="margin:0 0 10px;">Download Ready ✅</h2>
          <p style="margin:0 0 14px;">This is a manual resend of your download link.</p>

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
            Order: ${escapeHtml(session.id)}<br/>
            Plan: ${escapeHtml(plan)}<br/>
            Bundle: ${escapeHtml(bundle)}
          </p>
        </div>
      `,
    });

    if ((sendResult as any)?.error) {
      return NextResponse.json(
        {
          error: `Resend send failed: ${
            (sendResult as any).error?.message || "unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      resent_to: email,
      resend_id: (sendResult as any)?.data?.id || null,
      expires_at: expiresAtMs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Manual resend failed" },
      { status: 500 }
    );
  }
}