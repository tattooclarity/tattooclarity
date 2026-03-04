'use client';

import React from 'react';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fbf7ef',
        color: '#141414',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 22px 100px' }}>
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
            margin: '0 0 18px',
            letterSpacing: '-0.02em',
          }}
        >
          Privacy Policy
        </h1>

        {/* 生效日期（建議保留） */}
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.05em', marginBottom: 28 }}>
          Effective Date: March 2026
        </div>

        <div style={{ fontSize: '18px', lineHeight: '1.65', color: 'rgba(0,0,0,0.8)' }}>
          <p style={{ margin: '0 0 14px 0' }}>
            Tattoo Clarity collects only the information necessary to process your purchase and deliver your digital stencil file.
          </p>

          <p style={{ margin: '0 0 14px 0' }}>
            We do not sell, rent, or distribute your personal information to any third parties.
          </p>

          <p style={{ margin: '0 0 14px 0' }}>
            Payment processing is handled securely by trusted third-party providers (such as Stripe).<br />
            <strong>We do not store your credit card details on our servers.</strong>
          </p>

          <p style={{ margin: '0 0 14px 0' }}>
            We may use essential cookies and basic analytics to maintain security, improve performance, and understand how the site is used.
          </p>

          <p style={{ margin: '0 0 18px 0' }}>
            Customers are encouraged to download and securely store their purchased files immediately, as access may expire or change over time.
          </p>

          <p style={{ margin: '0' }}>
            If you have any privacy-related questions, contact{' '}
            <a href="mailto:info@tattooclarity.com" style={{ fontWeight: 700, color: '#111' }}>
              info@tattooclarity.com
            </a>
            .
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
  );
}