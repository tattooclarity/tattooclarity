// app/api/order/verify/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function safeStr(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function buildFile(theme: string, label: string, lang: string, styleLetter: string, type: string, ext: "png" | "svg") {
  // type: "single" | "phrase"
  const suffix = type === "phrase" ? "phrase" : "single";
  // premium 你已統一用 hyphen slug，例如 true-qi
  return `${theme}/${label}_${suffix}_${lang}_S${styleLetter}.${ext}`;
}

export async function GET(req: Request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_SECRET_KEY" },
        { status: 400 }
      );
    }

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
    const purchased_at = (session.created || 0) * 1000;
    const md = (session.metadata || {}) as Record<string, string>;

    // ✅ Step 3：由 metadata 砌 downloads
    const plan = safeStr(md.plan) || "standard";
    const bundle = safeStr(md.bundle) || "single";

    const downloads: Array<{ label: string; url: string }> = [];

    // ❗未付款唔派檔（download page 會顯示 paid=false）
    if (paid) {
      // ===== Mystery =====
      if (plan === "mystery") {
        const folder = safeStr(md.mystery_planFolder) || "standard_png";
        const file = safeStr(md.mystery_file) || "mystery/mystery_mystery_MYSTERY.png";

        downloads.push({
          label: "Mystery Design (PNG)",
          url: `/api/download?plan=${encodeURIComponent(folder)}&file=${encodeURIComponent(file)}`,
        });
      } else {
        // ===== Non-mystery =====
        const theme = safeStr(md.theme);
        const label = safeStr(md.label);
        const lang = safeStr(md.lang);
        const styleLetter = (safeStr(md.styleLetter) || "A").toUpperCase();
        const type = safeStr(md.type) || "single";

        const theme2 = safeStr(md.theme2);
        const label2 = safeStr(md.label2);
        const lang2 = safeStr(md.lang2);
        const styleLetter2 = (safeStr(md.styleLetter2) || "A").toUpperCase();
        const type2 = safeStr(md.type2) || "single";

        // basic/standard -> PNG only
        if (plan === "basic") {
          const file1 = buildFile(theme, label, "tc", styleLetter, type, "png");
          downloads.push({
            label: "Your Stencil (PNG)",
            url: `/api/download?plan=basic_png&file=${encodeURIComponent(file1)}`,
          });
        }

        if (plan === "standard") {
          const file1 = buildFile(theme, label, "tc", styleLetter, type, "png");
          downloads.push({
            label: "Your Stencil (PNG)",
            url: `/api/download?plan=standard_png&file=${encodeURIComponent(file1)}`,
          });

          if (bundle === "duo" && theme2 && label2) {
            const f2 = buildFile(theme2, label2, "tc", styleLetter2, type2, "png");
            downloads.push({
              label: "Your 2nd Stencil (PNG)",
              url: `/api/download?plan=standard_png&file=${encodeURIComponent(f2)}`,
            });
          }
        }

        // premium -> PNG + SVG (TC/SC)
        if (plan === "premium") {
          const filePng1 = buildFile(theme, label, lang, styleLetter, type, "png");
          const fileSvg1 = buildFile(theme, label, lang, styleLetter, type, "svg");

          downloads.push({
            label: "Stencil (PNG)",
            url: `/api/download?plan=premium_png&file=${encodeURIComponent(filePng1)}`,
          });
          downloads.push({
            label: "Vector (SVG)",
            url: `/api/download?plan=premium_svg&file=${encodeURIComponent(fileSvg1)}`,
          });

          if (bundle === "duo" && theme2 && label2) {
            const filePng2 = buildFile(theme2, label2, lang2 || "tc", styleLetter2, type2, "png");
            const fileSvg2 = buildFile(theme2, label2, lang2 || "tc", styleLetter2, type2, "svg");

            downloads.push({
              label: "2nd Stencil (PNG)",
              url: `/api/download?plan=premium_png&file=${encodeURIComponent(filePng2)}`,
            });
            downloads.push({
              label: "2nd Vector (SVG)",
              url: `/api/download?plan=premium_svg&file=${encodeURIComponent(fileSvg2)}`,
            });
          }
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        paid,
        order_id: orderId,
        purchased_at,
        metadata: md,
        downloads, // ✅ Step 3 output
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