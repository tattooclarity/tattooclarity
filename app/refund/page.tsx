'use client';

import React from 'react';
import Link from 'next/link';

export default function Refund() {
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
          Refund Policy
        </h1>

        {/* 生效日期 */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'rgba(0,0,0,0.45)',
            letterSpacing: '0.05em',
            marginBottom: 28,
          }}
        >
          Effective Date: March 2026
        </div>

        <div style={{ fontSize: '18px', lineHeight: '1.65', color: 'rgba(0,0,0,0.8)' }}>
          
          <p style={{ margin: '0 0 14px 0' }}>
            All stencil files are delivered digitally and become accessible immediately after payment.
          </p>

          <p style={{ margin: '0 0 14px 0' }}>
            Due to the digital nature of our products, all sales are final once files are delivered. We do not offer refunds, returns, or exchanges.
          </p>

          <p style={{ margin: '0 0 14px 0' }}>
            Please review your selected plan, character, and style carefully before completing checkout.
          </p>

          <p style={{ margin: '0 0 14px 0' }}>
            If you experience technical delivery issues (such as download errors or corrupted files), please contact us. We will manually ensure you receive your purchased files.
          </p>

          <p style={{ margin: '0' }}>
            For support, email{' '}
            <a href="mailto:info@tattooclarity.com" style={{ fontWeight: 700, color: '#111' }}>
              info@tattooclarity.com
            </a>
            .
          </p>
        </div>

        {/* 底部返回按鈕 */}
        <div
          style={{
            marginTop: '50px',
            paddingTop: '30px',
            borderTop: '1px solid rgba(0,0,0,0.1)',
          }}
        >
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