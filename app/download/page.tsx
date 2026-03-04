// app/download/page.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Plan = "basic" | "standard" | "premium" | "mystery";

// ✅ 全站統一 Support Email
const SUPPORT_EMAIL = "info@tattooclarity.com";

// ---- helpers ----
function toStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function toLower(v: any) {
  return toStr(v).toLowerCase();
}
function toUpper(v: any) {
  return toStr(v).toUpperCase();
}
function toBool(v: any) {
  const s = toLower(v);
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "duo";
}
function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ✅ plan normalize（保持你原本 plan，不硬加 duo 當 plan）
function normalizePlan(input: any): Plan {
  const p = toLower(input || "standard");
  if (p === "basic") return "basic";
  if (p === "standard") return "standard";
  if (p === "premium") return "premium";
  if (p === "mystery") return "mystery";
  return "standard";
}

function planLabel(plan: Plan, isDuo: boolean) {
  const base =
    plan === "basic" ? "Basic" : plan === "standard" ? "Standard" : plan === "premium" ? "Premium" : "Mystery";
  return isDuo ? `${base} (DUO)` : base;
}

function planDays(plan: Plan) {
  if (plan === "premium") return 45;
  if (plan === "standard") return 30;
  if (plan === "mystery") return 30;
  return 15;
}

function addDays(startMs: number, days: number) {
  return startMs + days * 24 * 60 * 60 * 1000;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function includesText(plan: Plan, isDuo: boolean) {
  if (plan === "premium") {
    return isDuo
      ? "2× 3000×3000px Transparent Background PNG + 2× Vector SVG"
      : "3000×3000px Transparent Background PNG + Vector SVG";
  }
  if (plan === "standard" || plan === "mystery") {
    return isDuo
      ? "2× 3000×3000px Transparent Background PNG (Print-Ready)"
      : "3000×3000px Transparent Background PNG (Print-Ready)";
  }
  return isDuo
    ? "2× 3000×3000px White Background PNG (Print-Ready)"
    : "3000×3000px White Background PNG (Print-Ready)";
}

function pillText(plan: Plan) {
  if (plan === "premium") return "ALL INCLUDED";
  return "PNG Only";
}

function mailtoSupport(subject: string) {
  const s = encodeURIComponent(subject);
  return `mailto:${SUPPORT_EMAIL}?subject=${s}`;
}

type VerifyResponse = {
  ok: boolean;
  paid?: boolean;
  order_id?: string;
  purchased_at?: number;
  metadata?: Record<string, string>;
  error?: string;
};

function DownloadContent() {
  const sp = useSearchParams();

  // ✅ order_id 必須存在
  const orderId = sp.get("order_id") || "UNKNOWN";

  // URL fallback（如果 metadata 無提供）
  const urlPlan = normalizePlan(sp.get("plan"));
  const urlTheme = sp.get("theme") || "balance";
  const urlLabel = sp.get("label") || "harmony";
  const urlLang = (sp.get("lang") || "tc").toLowerCase();
  const urlStyle = (sp.get("style") || "SA").toUpperCase();
  const urlType = (sp.get("type") || "single").toLowerCase(); // single/phrase

  // ✅ DUO 第二份 URL fallback（如果你有傳）
  const urlTheme2 = sp.get("theme2") || "";
  const urlLabel2 = sp.get("label2") || "";
  const urlLang2 = (sp.get("lang2") || "").toLowerCase();
  const urlStyle2 = (sp.get("style2") || "").toUpperCase();
  const urlType2 = (sp.get("type2") || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [verify, setVerify] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        const res = await fetch(`/api/order/verify?order_id=${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as VerifyResponse;
        if (!alive) return;
        setVerify(data);
      } catch (e: any) {
        if (!alive) return;
        setVerify({ ok: false, error: e?.message || "Verify failed" });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (orderId && orderId.startsWith("cs_")) run();
    else {
      setVerify({ ok: false, error: "Invalid or missing order_id." });
      setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [orderId]);

  const paid = !!verify?.paid;
  const ok = !!verify?.ok;

  // ✅ 最終資料：優先用 Stripe metadata
  const md = verify?.metadata || {};
  const plan = normalizePlan(md.plan || urlPlan);

  // ✅ DUO 判斷：支援多種 metadata/URL 寫法（你可以任用一種）
  // - md.qty / md.quantity = "2"
  // - md.duo = "true"/"1"
  // - md.bundle = "duo"
  // - URL ?qty=2 或 ?duo=1
  const qty =
    toInt(md.qty) ||
    toInt(md.quantity) ||
    toInt(sp.get("qty")) ||
    (toBool(md.duo) ? 2 : 0) ||
    (toLower(md.bundle) === "duo" ? 2 : 0) ||
    (toBool(sp.get("duo")) ? 2 : 0) ||
    1;

  const isDuo = qty >= 2;

  // ✅ 你 checkout metadata 之前用 theme/script/fonts/char
  // 下載頁想用 label/lang/style/type，先用 md（有就用），無就 fallback URL
  const theme = (md.theme || urlTheme) || "balance";
  const label = (md.label || urlLabel) || "harmony";
  const lang = ((md.lang || urlLang) || "tc").toLowerCase();
  const style = ((md.style || urlStyle) || "SA").toUpperCase();
  const isPhrase = ((md.type || urlType) || "single") === "phrase";

  // ✅ DUO 第二份資料（一定要至少有 label2，否則無法生成第二個檔案路徑）
  const theme2 = (md.theme2 || urlTheme2 || theme) as string;
  const label2 = (md.label2 || urlLabel2 || "") as string;
  const lang2 = (((md.lang2 || urlLang2) || lang) as string).toLowerCase();
  const style2 = (((md.style2 || urlStyle2) || style) as string).toUpperCase();
  const isPhrase2 = (((md.type2 || urlType2) || "single") as string).toLowerCase() === "phrase";

  const days = planDays(plan);

  const purchasedAtMs = verify?.purchased_at || 0;
  const invalidLink = !ok || !paid || !purchasedAtMs;

  const expiresAtMs = invalidLink ? 0 : addDays(purchasedAtMs, days);
  const isExpired = invalidLink ? true : Date.now() > expiresAtMs;

  const missingDuoSecond = isDuo && !label2;

  /**
   * ✅ DUO 修正：
   * - Standard DUO = 顯示 2 個 PNG download（兩條不同 file path）
   * - 如果 second set 冇傳（label2 空），就提示聯絡 support（避免下載同一個檔）
   */
  const downloads = useMemo(() => {
    const list: Array<{ key: string; label: string; href: string; className: string }> = [];

    const baseName1 = `${label}${isPhrase ? "_phrase" : ""}_${lang}_${style}`;
    const filePath1 = `${theme}/${baseName1}.png`;

    let pngLabel1 = "Download 3000×3000px PNG (Set 1)";
    if (plan === "basic") pngLabel1 = "Download 3000×3000px White Background PNG (Set 1)";
    else pngLabel1 = "Download 3000×3000px Transparent Background PNG (Set 1)";

    // ✅ 下載用 plan（對應你 /api/download 的 folder key）
    const downloadPlan: string = plan === "premium" ? "premium_png" : plan;

    const pngHref1 = `/api/download?plan=${encodeURIComponent(downloadPlan)}&file=${encodeURIComponent(filePath1)}`;
    list.push({ key: "png1", label: pngLabel1, href: pngHref1, className: "btnGold" });

    // ✅ DUO 第2份
    if (isDuo && label2) {
      const baseName2 = `${label2}${isPhrase2 ? "_phrase" : ""}_${lang2}_${style2}`;
      const filePath2 = `${theme2}/${baseName2}.png`;

      let pngLabel2 = "Download 3000×3000px PNG (Set 2)";
      if (plan === "basic") pngLabel2 = "Download 3000×3000px White Background PNG (Set 2)";
      else pngLabel2 = "Download 3000×3000px Transparent Background PNG (Set 2)";

      const pngHref2 = `/api/download?plan=${encodeURIComponent(downloadPlan)}&file=${encodeURIComponent(filePath2)}`;
      list.push({ key: "png2", label: pngLabel2, href: pngHref2, className: "btnGold" });
    }

    // ✅ Premium SVG（同樣可做 DUO，但你而家主要係 Standard DUO，所以先保留單份 SVG 邏輯）
    if (plan === "premium") {
      const svgPath1 = `${theme}/${baseName1}.svg`;
      list.push({
        key: "svg1",
        label: "Download Vector SVG",
        href: `/api/download?plan=premium_svg&file=${encodeURIComponent(svgPath1)}`,
        className: "btnOutline",
      });

      // 如果你之後要 Premium DUO，再打開呢段：
      // if (isDuo && label2) {
      //   const baseName2 = `${label2}${isPhrase2 ? "_phrase" : ""}_${lang2}_${style2}`;
      //   const svgPath2 = `${theme2}/${baseName2}.svg`;
      //   list.push({
      //     key: "svg2",
      //     label: "Download Vector SVG (Set 2)",
      //     href: `/api/download?plan=premium_svg&file=${encodeURIComponent(svgPath2)}`,
      //     className: "btnOutline",
      //   });
      // }
    }

    return list;
  }, [plan, theme, label, lang, style, isPhrase, isDuo, theme2, label2, lang2, style2, isPhrase2]);

  return (
    <div className="page">
      <div className="card">
        <div className="topLabel">DOWNLOAD CENTER</div>
        <h1 className="title">Download Ready</h1>
        <p className="subtitle">Your purchase is confirmed. Download your files below.</p>

        <div className="orderRef">
          ORDER REFERENCE: <span style={{ color: "rgba(0,0,0,0.65)" }}>#{orderId}</span>
        </div>

        <div className="box">
          <div className="boxLabel">YOUR PURCHASE</div>

          <div className="purchaseRow">
            <div className="purchaseLeft">
              <div className="purchasePlan">{planLabel(plan, isDuo)} Plan</div>
              <div className="purchaseIncludes">{includesText(plan, isDuo)}</div>
            </div>
            <div className="pill">{pillText(plan)}</div>
          </div>

          <div className="divider" />

          <div className="policy">
            <div className="policyRow">
              <span className="policyKey">Download access:</span>
              <span className="policyVal">{days} days</span>
            </div>

            {!invalidLink && (
              <div className="policyRow">
                <span className="policyKey">Expires on:</span>
                <span className="policyVal">{formatDate(expiresAtMs)}</span>
              </div>
            )}

            {loading ? (
              <div className="policyNote">Verifying your payment…</div>
            ) : invalidLink ? (
              <div className="policyNote">
                This link is missing purchase verification data. Please contact support with your order reference.
                {verify?.error ? (
                  <>
                    <br />
                    <span className="mono">{verify.error}</span>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="policyNote">
                Please download and back up your files immediately. Links expire automatically.
              </div>
            )}
          </div>

          <div className="divider" />

          <div className="boxLabel" style={{ marginTop: 2 }}>
            DOWNLOAD
          </div>

          {isExpired ? (
            <div className="expiredBox">
              <div className="expiredTitle">{invalidLink ? "Invalid download link." : "This download link has expired."}</div>
              <div className="expiredText">If you need access again, please contact support with your order reference.</div>
              <a
                href={mailtoSupport(`${invalidLink ? "Invalid Download Link" : "Expired Download"} - Order ${orderId}`)}
                className="btnOutline"
                style={{ marginTop: 12 }}
              >
                Contact Support
              </a>
            </div>
          ) : (
            <>
              {missingDuoSecond ? (
                <div className="expiredBox">
                  <div className="expiredTitle">DUO purchase detected, but Set 2 data is missing.</div>
                  <div className="expiredText">
                    Please contact support with your order reference so we can resend Set 2.
                  </div>
                  <a href={mailtoSupport(`Missing DUO Set 2 - Order ${orderId}`)} className="btnOutline" style={{ marginTop: 12 }}>
                    Contact Support
                  </a>
                </div>
              ) : null}

              {downloads.map((d, idx) => (
                <a
                  key={d.key}
                  href={d.href}
                  download
                  className={d.className}
                  style={idx === 0 ? undefined : { marginBottom: 12 }}
                >
                  <span style={{ fontSize: 18 }}>↓</span> {d.label}
                </a>
              ))}

              {plan === "basic" && <div className="hint">*Transparent background is available in Standard/Premium.</div>}
              {plan === "standard" && <div className="hint">*Vector SVG is only available in Premium.</div>}
              {plan === "mystery" && (
                <div className="hint">*Mystery delivers a pre-made Standard-quality PNG from the Mystery folder.</div>
              )}
            </>
          )}
        </div>

        <p className="supportText">
          Need help?{" "}
          <a href={mailtoSupport(`Help with Order ${orderId}`)} className="supportLink">
            Contact Support
          </a>
        </p>

        <Link href="/" className="homeLink">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <>
      {/* ✅ 放喺最外層，避免你再次出現「變白底純文字」 */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        :root {
          --bg: #fbf6ee;
          --card: #ffffff;
          --ink: #111;
          --muted: rgba(0, 0, 0, 0.62);
          --border: rgba(0, 0, 0, 0.08);
          --gold: #caa34a;
          --goldDeep: #8a6a1c;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--ink);
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }
        a {
          color: inherit;
          text-decoration: none;
        }
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 640px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
        }
        .topLabel {
          font-size: 12px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.35);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .title {
          font-family: "Playfair Display", serif;
          font-size: 34px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 10px;
          letter-spacing: -0.02em;
        }
        .subtitle {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.5;
          margin: 0 0 10px;
          font-weight: 500;
        }
        .orderRef {
          font-size: 12px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.4);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 26px;
        }
        .box {
          background: #f9f9f9;
          border: 1px dashed rgba(0, 0, 0, 0.15);
          border-radius: 16px;
          padding: 22px;
          margin-bottom: 26px;
          text-align: left;
        }
        .boxLabel {
          font-size: 12px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }
        .purchaseRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .purchasePlan {
          font-size: 16px;
          font-weight: 900;
          color: #111;
        }
        .purchaseIncludes {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.55);
        }
        .pill {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 900;
          color: var(--goldDeep);
          background: rgba(202, 163, 74, 0.12);
          border: 1px solid rgba(202, 163, 74, 0.25);
          padding: 6px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
          margin: 16px 0;
        }
        .policy {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 14px 14px;
        }
        .policyRow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin: 2px 0;
        }
        .policyKey {
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .policyVal {
          font-size: 13px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.78);
        }
        .policyNote {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.48);
          font-weight: 650;
          text-align: center;
          line-height: 1.4;
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 900;
        }
        .expiredBox {
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.85);
          border-radius: 14px;
          padding: 14px;
          text-align: center;
          margin-bottom: 12px;
        }
        .expiredTitle {
          font-weight: 900;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.82);
        }
        .expiredText {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 650;
          color: rgba(0, 0, 0, 0.52);
          line-height: 1.45;
        }
        .btnGold {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          cursor: pointer;
          padding: 16px 18px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15px;
          background: linear-gradient(180deg, rgba(202, 163, 74, 0.98), rgba(202, 163, 74, 0.82));
          color: #1b1b1b;
          box-shadow: 0 8px 24px rgba(202, 163, 74, 0.25);
          transition: all 0.2s ease;
          margin-bottom: 12px;
          text-align: center;
        }
        .btnGold:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(202, 163, 74, 0.35);
          filter: brightness(1.03);
        }
        .btnGold:active {
          transform: translateY(1px);
        }
        .btnOutline {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1.5px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.7);
          transition: all 0.2s;
          text-align: center;
          margin-bottom: 12px;
        }
        .btnOutline:hover {
          border-color: rgba(0, 0, 0, 0.3);
          color: #111;
          background: #fafafa;
        }
        .hint {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.45);
          margin-top: 8px;
          font-weight: 600;
          text-align: center;
        }
        .supportText {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.5);
          font-weight: 500;
          margin: 0;
          text-align: center;
        }
        .supportLink {
          color: var(--gold);
          font-weight: 800;
          text-decoration: none;
        }
        .supportLink:hover {
          color: #111;
          text-decoration: underline;
        }
        .homeLink {
          display: inline-block;
          margin-top: 24px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }
        .homeLink:hover {
          color: var(--ink);
        }
        @media (max-width: 720px) {
          .card {
            padding: 36px 18px;
            border-radius: 20px;
          }
          .title {
            font-size: 30px;
          }
        }
      `}</style>

      <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>Loading downloads...</div>}>
        <DownloadContent />
      </Suspense>
    </>
  );
}