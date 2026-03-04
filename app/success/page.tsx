// app/success/page.tsx
"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Plan = "basic" | "standard" | "premium" | "mystery";
type Bundle = "single" | "duo";

const PLAN_LABEL: Record<Plan, string> = {
  basic: "Basic Plan",
  standard: "Standard Plan",
  premium: "Premium Plan",
  mystery: "Mystery Character",
};

const PLAN_PRICE: Record<Plan, string> = {
  basic: "US$15",
  standard: "US$29",
  premium: "US$49",
  mystery: "US$19",
};

function SuccessContent() {
  const sp = useSearchParams();

  const orderId = sp.get("order_id") || "";
  const planRaw = (sp.get("plan") || "standard").toLowerCase();
  const bundleRaw = (sp.get("bundle") || "single").toLowerCase();

  const plan = (["basic", "standard", "premium", "mystery"].includes(planRaw)
    ? planRaw
    : "standard") as Plan;

  const bundle = (bundleRaw === "duo" ? "duo" : "single") as Bundle;

  const title = useMemo(() => {
    const base = PLAN_LABEL[plan];
    return bundle === "duo" ? `${base} (DUO)` : base;
  }, [plan, bundle]);

  const price = useMemo(() => {
    // 如果你 DUO 係 Standard=50 / Premium=78，可在這裡顯示：
    if (bundle === "duo" && plan === "standard") return "US$50 (DUO)";
    if (bundle === "duo" && plan === "premium") return "US$78 (DUO)";
    return PLAN_PRICE[plan];
  }, [plan, bundle]);

  const downloadHref = `/download?order_id=${encodeURIComponent(
    orderId
  )}&plan=${encodeURIComponent(plan)}&bundle=${encodeURIComponent(bundle)}`;

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 34, fontWeight: 900 }}>
        Payment Successful ✅
      </h1>

      <p style={{ margin: "0 0 18px", color: "#555" }}>
        Thanks! Your payment went through. Your files are ready.
      </p>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 14,
          padding: 16,
          marginBottom: 18,
          background: "#fff",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
          Your purchase
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>
            <span style={{ color: "#666" }}>Plan:</span>{" "}
            <b style={{ color: "#111" }}>{title}</b>
          </div>

          <div>
            <span style={{ color: "#666" }}>Price:</span>{" "}
            <b style={{ color: "#111" }}>{price}</b>
          </div>
        </div>

        <div style={{ marginTop: 10, color: "#666", fontSize: 14 }}>
          <span>Order ID:</span>{" "}
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {orderId || "(missing)"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href={downloadHref}
          style={{
            display: "inline-block",
            padding: "12px 16px",
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 900,
          }}
        >
          Go to Download
        </Link>

        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            color: "#111",
            textDecoration: "none",
            fontWeight: 900,
          }}
        >
          Back to Home
        </Link>
      </div>

      <p style={{ marginTop: 18, color: "#666", fontSize: 14 }}>
        If you don’t see the receipt email, check spam/junk.
      </p>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}