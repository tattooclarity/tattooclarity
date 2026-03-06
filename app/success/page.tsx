// app/success/page.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
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

function normalizePlan(input: string | null): Plan {
  const p = (input || "standard").toLowerCase();
  return (["basic", "standard", "premium", "mystery"].includes(p)
    ? p
    : "standard") as Plan;
}

function normalizeBundle(input: string | null): Bundle {
  const b = (input || "single").toLowerCase();
  return (b === "duo" ? "duo" : "single") as Bundle;
}

type StripeSessionResponse = {
  paid: boolean;
  email?: string | null;
  session_id?: string;
  purchased_at?: number;
  quebec_blocked?: boolean;
  metadata?: Record<string, string>;
  error?: string;
};

function SuccessContent() {
  const sp = useSearchParams();

  const sessionId = sp.get("session_id") || "";
  const legacyOrderId = sp.get("order_id") || "";

  const plan = normalizePlan(sp.get("plan"));
  const bundle = normalizeBundle(sp.get("bundle"));

  const [paid, setPaid] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!sessionId);
  const [quebecBlocked, setQuebecBlocked] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setPaid(null);
      setEmail(null);
      setQuebecBlocked(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/stripe/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({}))) as StripeSessionResponse;
        if (cancelled) return;

        if (!res.ok) {
          setPaid(false);
          setEmail(null);
          setQuebecBlocked(false);
          setLoading(false);
          return;
        }

        setPaid(!!data.paid);
        setEmail(data.email ?? null);
        setQuebecBlocked(!!data.quebec_blocked);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setPaid(false);
        setEmail(null);
        setQuebecBlocked(false);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const title = useMemo(() => {
    const base = PLAN_LABEL[plan];
    return bundle === "duo" ? `${base} (DUO)` : base;
  }, [plan, bundle]);

  const price = useMemo(() => {
    if (bundle === "duo" && plan === "standard") return "US$50 (DUO)";
    if (bundle === "duo" && plan === "premium") return "US$78 (DUO)";
    return PLAN_PRICE[plan];
  }, [plan, bundle]);

  const downloadHref = sessionId
    ? `/download?order_id=${encodeURIComponent(
        sessionId
      )}&session_id=${encodeURIComponent(sessionId)}&plan=${encodeURIComponent(
        plan
      )}&bundle=${encodeURIComponent(bundle)}`
    : `/download?order_id=${encodeURIComponent(
        legacyOrderId
      )}&plan=${encodeURIComponent(plan)}&bundle=${encodeURIComponent(bundle)}`;

  const shownIdLabel = sessionId ? "Session ID:" : "Order ID:";
  const shownIdValue = sessionId || legacyOrderId || "(missing)";

  const pageTitle = loading
    ? "Checking payment..."
    : quebecBlocked
    ? "Order Blocked"
    : paid === true
    ? "Payment Successful ✅"
    : "Payment Not Confirmed";

  const pageSubtitle = loading
    ? "Please wait while we verify your payment."
    : quebecBlocked
    ? "This service is not available to customers located in Québec."
    : paid === true
    ? "Thanks! Your payment went through. Your files are ready."
    : "We could not confirm this payment yet.";

  const disableDownload = loading || paid !== true || quebecBlocked;

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 34, fontWeight: 900 }}>
        {pageTitle}
      </h1>

      <p style={{ margin: "0 0 18px", color: "#555" }}>{pageSubtitle}</p>

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
          <span>{shownIdLabel}</span>{" "}
          <span
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          >
            {shownIdValue}
          </span>
        </div>

        <div style={{ marginTop: 10, color: "#666", fontSize: 14 }}>
          <span>Email:</span>{" "}
          {loading ? (
            <span>Checking…</span>
          ) : email ? (
            <b style={{ color: "#111" }}>{email}</b>
          ) : sessionId ? (
            <span>(not found)</span>
          ) : (
            <span>(no session_id)</span>
          )}
        </div>

        {sessionId && (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            {loading ? (
              <span style={{ color: "#666" }}>Verifying payment…</span>
            ) : quebecBlocked ? (
              <span style={{ color: "#b00020", fontWeight: 800 }}>
                ⛔ Service unavailable in Québec
              </span>
            ) : paid === true ? (
              <span style={{ color: "#0a7a2f", fontWeight: 800 }}>
                ✅ Payment confirmed
              </span>
            ) : paid === false ? (
              <span style={{ color: "#b00020", fontWeight: 800 }}>
                ⚠️ Payment not confirmed
              </span>
            ) : (
              <span style={{ color: "#666" }}>—</span>
            )}
          </div>
        )}
      </div>

      {quebecBlocked && (
        <div
          style={{
            border: "1px solid #fecaca",
            borderRadius: 14,
            padding: 16,
            marginBottom: 18,
            background: "#fef2f2",
            color: "#991b1b",
            fontSize: 14,
            lineHeight: 1.5,
            fontWeight: 700,
          }}
        >
          This order cannot be fulfilled because the billing location is in Québec.
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href={downloadHref}
          prefetch={false}
          style={{
            display: "inline-block",
            padding: "12px 16px",
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 900,
            opacity: disableDownload ? 0.5 : 1,
            pointerEvents: disableDownload ? "none" : "auto",
          }}
        >
          Go to Download
        </Link>

        <Link
          href="/"
          prefetch={false}
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
        {quebecBlocked ? (
          <>Please contact support if you believe this billing location was detected incorrectly.</>
        ) : email ? (
          <>
            We’ll send the download link to <b>{email}</b>. If you don’t see it,
            check spam/junk.
          </>
        ) : (
          <>If you don’t see the receipt email, check spam/junk.</>
        )}
      </p>

      {!sessionId && (
        <p style={{ marginTop: 10, color: "#b00020", fontSize: 13 }}>
          Note: session_id is missing. Make sure your checkout success_url uses:{" "}
          <span
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          >
            ?session_id=&#123;CHECKOUT_SESSION_ID&#125;
          </span>
        </p>
      )}
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