/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SiteFooter() {
  const [copied, setCopied] = useState(false);
  const [isContactOpen, setContactOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');

  const copyToClipboard = async () => {
    if (typeof window === 'undefined') return;
    const text = window.location.href;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }

    setTimeout(() => setCopied(false), 1100);
  };

  const orderWrapStyle = (show: boolean): React.CSSProperties => ({
    overflow: 'hidden',
    maxHeight: show ? 110 : 0,
    opacity: show ? 1 : 0,
    transition: 'all 0.3s ease-out',
    marginTop: show ? 6 : 0,
  });

  const styles = {
    footer: {
      borderTop: '1px solid rgba(0,0,0,0.08)',
      padding: '30px 0 20px',
      background: '#fbf6ee',
    },
    wrap: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    },
    topIcons: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 28,
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr 1fr',
      gap: 14,
      alignItems: 'center',
    },
    leftBlock: {
      fontSize: 11,
      fontWeight: 900,
      color: '#141414',
      letterSpacing: '0.05em',
      lineHeight: 1.45,
    },
    leftSub: {
      color: 'rgba(0,0,0,0.5)',
      marginTop: 6,
      display: 'inline-block',
      lineHeight: 1.5,
      fontWeight: 700,
    },
    linksRow: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      fontSize: 12,
      fontWeight: 900,
      color: '#141414',
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    dot: { color: 'rgba(0,0,0,0.25)' },
    footerFine: {
      fontSize: 10,
      color: 'rgba(0,0,0,0.45)',
      lineHeight: 1.5,
      maxWidth: 520,
      margin: '0 auto',
      textAlign: 'center',
      fontWeight: 650,
    },
    footerContactBtn: {
      background: 'none',
      border: 'none',
      padding: 0,
      font: 'inherit',
      fontSize: 12,
      fontWeight: 900,
      color: '#141414',
      cursor: 'pointer',
    },
    rightBlock: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 6,
    },
    rightText: {
      fontSize: 10,
      color: 'rgba(0,0,0,0.4)',
      fontWeight: 700,
      letterSpacing: '0.05em',
    },
    paymentsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' },

    modalOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalBox: {
      background: '#fff',
      width: '100%',
      maxWidth: 480,
      borderRadius: 20,
      padding: '40px 36px',
      position: 'relative',
      boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
    },
    closeBtn: {
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0,0,0,0.04)',
      border: 'none',
      width: 34,
      height: 34,
      borderRadius: '50%',
      fontSize: 16,
      cursor: 'pointer',
      color: 'rgba(0,0,0,0.4)',
    },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    label: {
      fontSize: 12,
      fontWeight: 800,
      color: 'rgba(0,0,0,0.5)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    input: {
      width: '100%',
      border: '1px solid rgba(0,0,0,0.15)',
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 14,
      background: '#fafafa',
      outline: 'none',
    },
    submit: {
      width: '100%',
      border: 0,
      cursor: 'pointer',
      padding: '14px 18px',
      borderRadius: 16,
      fontWeight: 950,
      fontSize: 16,
      background: 'linear-gradient(180deg, rgba(202, 163, 74, 0.98), rgba(202, 163, 74, 0.82))',
      color: '#1b1b1b',
      boxShadow: '0 8px 24px rgba(202, 163, 74, 0.3)',
    },
    copiedTag: {
      position: 'absolute',
      top: 28,
      fontSize: 9,
      fontWeight: 950,
      color: '#caa34a',
      whiteSpace: 'nowrap',
    },
  } satisfies Record<string, React.CSSProperties>;

  const showOrder =
    supportSubject.includes('Order') || supportSubject.includes('File Access');

  return (
    <>
      <footer style={styles.footer}>
        <div style={styles.wrap}>
          {/* icons */}
          <div style={styles.topIcons}>
            <a
              href="mailto:info@tattooclarity.com"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <img src="/social/email.png" alt="Email Us" style={{ height: 22 }} />
            </a>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src="/social/link.png"
                alt="Copy Link"
                onClick={copyToClipboard}
                style={{ height: 22, cursor: 'pointer' }}
              />
              {copied && <span style={styles.copiedTag}>COPIED ✓</span>}
            </div>
          </div>

          {/* grid */}
          <div style={styles.footerGrid}>
            {/* left */}
            <div style={styles.leftBlock}>
              © 2026 TATTOO CLARITY STUDIO
              <br />
              <span style={styles.leftSub}>
                info@tattooclarity.com
                <br />
                For studio licensing inquiries, contact us.
              </span>
            </div>

            {/* center */}
            <div style={{ textAlign: 'center' }}>
              <div style={styles.linksRow}>
                <Link href="/terms">Terms</Link>
                <span style={styles.dot}>•</span>
                <Link href="/privacy">Privacy</Link>
                <span style={styles.dot}>•</span>
                <Link href="/refund">Refund Policy</Link>
                <span style={styles.dot}>•</span>
                <Link href="/license">Font licensing</Link>
                <span style={styles.dot}>•</span>
                <button onClick={() => setContactOpen(true)} style={styles.footerContactBtn}>
                  Contact Us
                </button>
              </div>

              <div style={styles.footerFine}>
                Product images are AI-generated mockups for visual guidance only.
                <br />
                All sales are final on digital downloads.
              </div>
            </div>

            {/* right */}
            <div style={styles.rightBlock}>
              <div style={styles.rightText}>Secure payment powered by Stripe.</div>
              <div style={styles.paymentsRow}>
                {['visa', 'mastercard', 'amex', 'applepay', 'googlepay'].map((card) => (
                  <img key={card} src={`/payments/${card}.png`} alt={card} style={{ height: 18 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* modal */}
      {isContactOpen && (
        <div style={styles.modalOverlay} onClick={() => setContactOpen(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setContactOpen(false)} aria-label="Close">
              ✕
            </button>

            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 26, marginTop: 0, marginBottom: 6 }}>
              Support Request
            </h3>

            <form action="https://formspree.io/f/YOUR_REAL_FORMSPREE_ID" method="POST" style={styles.form}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={styles.label}>Name</label>
                <input type="text" name="name" required style={styles.input} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={styles.label}>Email Address</label>
                <input type="email" name="email" required style={styles.input} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={styles.label}>Subject</label>
                <select
                  name="subject"
                  required
                  defaultValue=""
                  onChange={(e) => setSupportSubject(e.target.value)}
                  style={styles.input}
                >
                  <option value="" disabled hidden>
                    Select an inquiry type...
                  </option>
                  <option value="Order Support">Order Support (include order number)</option>
                  <option value="File Access">File Access / Download Issue</option>
                  <option value="Studio Inquiry">Studio / Commercial Inquiry</option>
                </select>
              </div>

              <div style={orderWrapStyle(showOrder)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...styles.label, color: '#caa34a' }}>Order Number *</label>
                  <input
                    type="text"
                    name="order_number"
                    placeholder="#12345"
                    required={showOrder}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={styles.label}>Message</label>
                <textarea name="message" rows={4} required style={styles.input} />
              </div>

              <button type="submit" style={styles.submit}>
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}