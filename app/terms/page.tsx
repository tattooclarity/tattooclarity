'use client';

import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      {/* ✅ Noindex: prevent Google indexing */}
      <meta name="robots" content="noindex, nofollow" />

      <div
        style={{
          minHeight: '100vh',
          background: '#fbf7ef',
          color: '#141414',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 22px 100px' }}>
          {/* ✅ Internal note (guaranteed visible) */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'rgba(0,0,0,0.35)',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            For internal reference only
          </div>

          {/* 頂部返回按鈕 */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '40px',
              color: '#caa34a',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.05em',
            }}
          >
            <span>←</span> Back to Home
          </Link>

          <h1
            style={{
              fontFamily: 'ui-serif, Georgia, serif',
              fontSize: '42px',
              fontWeight: 800,
              margin: '0 0 30px',
              letterSpacing: '-0.02em',
            }}
          >
            Terms of Service
          </h1>

          {/* ✅ 字體 18px，行距 1.65，段落間距精確控制為 10px */}
          <div style={{ fontSize: '18px', lineHeight: '1.65', color: 'rgba(0,0,0,0.8)' }}>
            <p style={{ margin: '0 0 10px 0' }}>
              Tattoo Clarity provides digital stencil files only. No physical products are shipped.
            </p>

            <p style={{ margin: '0 0 10px 0' }}>
              All purchases are one-time payments. No subscriptions.
            </p>

            <p style={{ margin: '0 0 10px 0' }}>
              Customers are solely responsible for verifying the meaning, accuracy, and cultural context of their chosen text{' '}
              <strong>before</strong> tattooing.
              <br />
              We are a technical design tool, not a translation service.
            </p>

            <p style={{ margin: '0' }}>
              Access to generated files is tied to the active operation of this service. We recommend saving your files
              securely to a local or cloud drive immediately after purchase.
            </p>
          </div>

          {/* 底部返回按鈕 */}
          <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                borderRadius: '12px',
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.14)',
                color: '#111',
                textDecoration: 'none',
                fontWeight: 700,
                boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
              }}
            >
              Return to Home
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}