// app/license/page.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Font Licensing Information | Tattoo Clarity',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LicensePage() {
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
        
        {/* Top Back */}
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
          Font Licensing Information
        </h1>

        <div style={{ fontSize: '18px', lineHeight: '1.65', color: 'rgba(0,0,0,0.8)' }}>
          <p style={{ margin: '0 0 20px 0' }}>
            Tattoo Clarity uses open-licensed fonts to render previews and generate studio-ready outputs.
            Fonts listed below are used under their respective licenses.
          </p>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '40px 0 16px',
              color: '#141414',
              fontFamily: 'ui-serif, Georgia, serif',
            }}
          >
            Fonts Used
          </h2>

          <div
            style={{
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '20px 24px',
              borderRadius: '16px',
              marginBottom: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontWeight: 800, color: '#111', marginBottom: '4px' }}>
              LXGW WenKai TC
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(0,0,0,0.6)' }}>
              License: SIL Open Font License (OFL)
            </div>
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '40px 0 16px',
              color: '#141414',
              fontFamily: 'ui-serif, Georgia, serif',
            }}
          >
            Notes
          </h2>

          <ul style={{ margin: '0 0 30px 0', paddingLeft: '24px' }}>
            <li style={{ marginBottom: '10px' }}>
              We do not sell or redistribute font files as a standalone product.
            </li>
            <li style={{ marginBottom: '10px' }}>
              Fonts are embedded/served only as needed to render previews and outputs.
            </li>
          </ul>

          <p style={{ margin: '0 0 10px 0' }}>
            If you have any questions about licensing, contact{' '}
            <a
              href="mailto:info@tattooclarity.com"
              style={{ fontWeight: 700, color: '#111' }}
            >
              info@tattooclarity.com
            </a>
            .
          </p>
        </div>

        {/* Bottom Back */}
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

        <div
          style={{
            marginTop: '40px',
            fontSize: '13px',
            color: 'rgba(0,0,0,0.4)',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          © {new Date().getFullYear()} TATTOO CLARITY STUDIO. All rights reserved.
        </div>

      </main>
    </div>
  );
}