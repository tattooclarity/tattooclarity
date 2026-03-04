// app/download/page.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Plan = "basic" | "standard" | "premium" | "mystery";
const SUPPORT_EMAIL = "info@tattooclarity.com";

// Helper functions... (保留你原本的 helpers，這裡簡化省略)
function toLower(v: any) { return String(v || "").toLowerCase(); }
function normalizePlan(input: any): Plan {
  const p = toLower(input || "standard");
  if (["basic", "standard", "premium", "mystery"].includes(p)) return p as Plan;
  return "standard";
}
function planLabel(plan: Plan, isDuo: boolean) {
  const base = plan.charAt(0).toUpperCase() + plan.slice(1);
  if (plan === "mystery") return base;
  return isDuo ? `${base} (DUO)` : base;
}
function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function DownloadContent() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id") || "UNKNOWN";
  
  // State
  const [loading, setLoading] = useState(true);
  const [verify, setVerify] = useState<any>(null); // 簡化 type

  // Fetch verify
  useEffect(() => {
    if (!orderId || !orderId.startsWith("cs_")) {
        setVerify({ ok: false, error: "Invalid Order ID" });
        setLoading(false);
        return;
    }
    fetch(`/api/order/verify?order_id=${encodeURIComponent(orderId)}`)
      .then(res => res.json())
      .then(data => setVerify(data))
      .catch(err => setVerify({ ok: false, error: err.message }))
      .finally(() => setLoading(false));
  }, [orderId]);

  const md = verify?.metadata || {};
  const plan = normalizePlan(md.plan || sp.get("plan"));
  
  // Duo Check
  const isDuo = plan !== "mystery" && (
    md.bundle === "duo" || 
    sp.get("bundle") === "duo" || 
    Number(md.qty) >= 2 || 
    (md.label2 && md.label2 !== "")
  );

  // Time logic
  const days = plan === "premium" ? 45 : (plan === "standard" || plan === "mystery" ? 30 : 15);
  const purchasedAt = verify?.purchased_at || 0;
  const expiresAt = purchasedAt + days * 86400000;
  const isExpired = !verify?.ok ? false : Date.now() > expiresAt;
  const invalidLink = !loading && !verify?.ok;

  // Metadata Extraction
  const theme = md.theme || "balance";
  const label = md.label || "harmony";
  const lang = (md.lang || "tc").toLowerCase();
  const style = (md.style || "SA").toUpperCase();

  const theme2 = md.theme2 || theme;
  const label2 = md.label2 || "";
  const lang2 = (md.lang2 || lang).toLowerCase();
  const style2 = (md.style2 || style).toUpperCase();

  const downloads = useMemo(() => {
    const list = [];

    // ✅ Mystery Logic: 讀取 Checkout 存的檔名
    if (plan === "mystery") {
        // 從 metadata 拿檔名，如果沒有就用預設
        const mysteryFile = md.mystery_file || "mystery_mystery_MYSTERY.png";
        // 告訴 API 去 mystery_png 資料夾找
        const downloadPlan = md.mystery_planFolder || "mystery_png"; 
        
        list.push({
            key: "mystery",
            label: "Download Mystery Tattoo (Standard Quality)",
            href: `/api/download?plan=${downloadPlan}&file=${encodeURIComponent(mysteryFile)}`,
            className: "btnGold"
        });
    } else {
        // Standard / Premium / Basic Logic
        const downloadPlan = plan === "premium" ? "premium_png" : plan;
        
        // Set 1
        const file1 = `${theme}/${label}_${lang}_${style}.png`; // 假設單字結構
        const labelText = plan === "basic" ? "White Background" : "Transparent Background";
        
        list.push({
            key: "png1",
            label: `Download 3000px ${labelText} PNG (Set 1)`,
            href: `/api/download?plan=${downloadPlan}&file=${encodeURIComponent(file1)}`,
            className: "btnGold"
        });

        // Set 2 (Duo)
        if (isDuo && label2) {
            const file2 = `${theme2}/${label2}_${lang2}_${style2}.png`;
            list.push({
                key: "png2",
                label: `Download 3000px ${labelText} PNG (Set 2)`,
                href: `/api/download?plan=${downloadPlan}&file=${encodeURIComponent(file2)}`,
                className: "btnGold"
            });
        }

        // SVG (Premium)
        if (plan === "premium") {
             const svg1 = `${theme}/${label}_${lang}_${style}.svg`;
             list.push({
                key: "svg1",
                label: isDuo ? "Download Vector SVG (Set 1)" : "Download Vector SVG",
                href: `/api/download?plan=premium_svg&file=${encodeURIComponent(svg1)}`,
                className: "btnOutline"
             });

             if (isDuo && label2) {
                const svg2 = `${theme2}/${label2}_${lang2}_${style2}.svg`;
                list.push({
                   key: "svg2",
                   label: "Download Vector SVG (Set 2)",
                   href: `/api/download?plan=premium_svg&file=${encodeURIComponent(svg2)}`,
                   className: "btnOutline"
                });
             }
        }
    }
    return list;
  }, [plan, isDuo, md, theme, label, lang, style, theme2, label2, lang2, style2]);

  // UI Render (保留你原本的 CSS 和結構，這裡只列出核心部分)
  return (
    <div className="page">
        <div className="card">
            <div className="topLabel">DOWNLOAD CENTER</div>
            <h1 className="title">Download Ready</h1>
            <div className="orderRef">ORDER: #{orderId.slice(-6)}</div>
            
            {loading && <p>Verifying...</p>}
            
            {invalidLink && (
                <div className="expiredBox">
                    <div className="expiredTitle">Invalid or Missing Order</div>
                    <div className="expiredText">{verify?.error}</div>
                </div>
            )}

            {!loading && !invalidLink && (
                <div className="box">
                     <div className="boxLabel">YOUR FILES</div>
                     {isExpired ? (
                        <div className="expiredBox">Link Expired</div>
                     ) : (
                        downloads.map(d => (
                            <a key={d.key} href={d.href} download className={d.className}>
                                ↓ {d.label}
                            </a>
                        ))
                     )}
                </div>
            )}
            
            <Link href="/" className="homeLink">← Back to Homepage</Link>
        </div>
        
        {/* CSS Styles */}
        <style jsx global>{`
            /* 把你原本的 CSS 貼在這裡 */
            .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fbf6ee; font-family: sans-serif; }
            .card { background: white; padding: 40px; border-radius: 20px; max-width: 600px; width: 100%; text-align: center; }
            .btnGold { display: block; background: #caa34a; padding: 15px; border-radius: 10px; margin-bottom: 10px; font-weight: bold; cursor: pointer; }
            .btnOutline { display: block; border: 1px solid #ddd; padding: 15px; border-radius: 10px; margin-bottom: 10px; font-weight: bold; cursor: pointer; }
            .expiredBox { background: #fee; padding: 20px; border-radius: 10px; color: #c00; }
        `}</style>
    </div>
  );
}

export default function DownloadPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DownloadContent />
        </Suspense>
    );
}