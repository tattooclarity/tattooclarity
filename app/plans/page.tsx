'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

type PlanId = 'basic' | 'standard' | 'premium' | 'mystery';

type Plan = {
  id: PlanId;
  name: string;
  price: number;
  duoPrice?: number; // Standard / Premium 有 Duo
  subtitle: string;
  kicker: string;
  features: string[];
  color: string;
  popular?: boolean;
  note?: string;
  cta: string;
};

export default function PlansPage() {
  const PLANS: Plan[] = useMemo(
    () => [
      {
        id: 'basic',
        name: 'BASIC',
        price: 15,
        subtitle: 'Quick Personal Preview',
        kicker: 'Fast check before you commit',
        features: [
          '1 design selection (Single only)',
          '3000×3000px PNG (White background)',
          'Traditional (TC) only',
          'Personal use',
        ],
        color: '#6c3f1f',
        note: 'Want transparent background? Upgrade to Standard.',
        cta: 'Start Preview →',
      },
      {
        id: 'standard',
        name: 'STANDARD',
        price: 29,
        duoPrice: 50,
        subtitle: 'Most Popular • Studio-Ready PNG',
        kicker: 'Best value for 2 placements',
        features: [
          'Duo available (pick 2 designs)',
          '3000×3000px PNG (Transparent background)',
          'Traditional (TC) only',
          'Artist-friendly clean layout',
        ],
        color: '#111',
        popular: true,
        note: 'Vector SVG is Premium only.',
        cta: 'Choose Standard →',
      },
      {
        id: 'premium',
        name: 'PREMIUM',
        price: 49,
        duoPrice: 78,
        subtitle: 'Professional Bundle',
        kicker: 'For studios / scaling / re-size forever',
        features: [
          'Unlock Simplified (SC) + Traditional (TC)',
          '3000×3000px PNG (Transparent background)',
          'Vector SVG (Unlimited scaling)',
          'Commercial / studio-ready use',
        ],
        color: '#caa34a',
        note: 'Best for tattoo artists + print workflows.',
        cta: 'Go Premium →',
      },
      {
        id: 'mystery',
        name: 'MYSTERY',
        price: 19,
        subtitle: 'Curated Surprise',
        kicker: 'Curated — not random',
        features: [
          'Curated selection (not random)',
          'Revealed after payment',
          '3000×3000px PNG (background may vary)',
          'Fun add-on / gift pick',
        ],
        color: '#8e44ad',
        note: 'Great if you want a surprise style.',
        cta: 'Try Mystery →',
      },
    ],
    []
  );

  const formatUsd = (n: number) => `USD $${n}`;

  return (
    <div style={{ minHeight: '100vh', background: '#fbf6ee', padding: '64px 20px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: 'rgba(0,0,0,0.38)',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          ← Back to Home
        </Link>

        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 42, margin: '8px 0 10px', letterSpacing: '-0.02em' }}>
          Choose Your Package
        </h1>

        <div style={{ color: '#caa34a', fontWeight: 900, letterSpacing: '0.12em', fontSize: 12, marginBottom: 10 }}>
          STUDIO-READY • CULTURALLY REVIEWED
        </div>

        <p style={{ margin: '0 auto 44px', maxWidth: 720, color: 'rgba(0,0,0,0.58)', fontWeight: 600, lineHeight: 1.6 }}>
          One-time purchase. Instant delivery after checkout. Pick the package that matches how serious you are about a permanent decision.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 22, alignItems: 'stretch' }}>
          {PLANS.map((plan) => {
            const isPopular = !!plan.popular;

            return (
              <div
                key={plan.id}
                style={{
                  background: '#fff',
                  padding: '40px 24px',
                  borderRadius: 32,
                  border: isPopular ? `2px solid ${plan.color}` : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: isPopular ? '0 18px 45px rgba(0,0,0,0.08)' : '0 15px 35px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: '#e24a4a',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 950,
                      letterSpacing: '0.08em',
                      boxShadow: '0 10px 20px rgba(226,74,74,0.25)',
                    }}
                  >
                    BEST VALUE
                  </span>
                )}

                {/* Header */}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: plan.color, letterSpacing: '0.12em' }}>{plan.name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: 'rgba(0,0,0,0.55)' }}>{plan.subtitle}</div>
                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: 'rgba(0,0,0,0.38)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {plan.kicker}
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginTop: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 46, fontWeight: 950, letterSpacing: '-0.02em', color: '#111', lineHeight: 1 }}>
                    ${plan.price}
                    <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(0,0,0,0.35)', marginLeft: 8 }}>USD</span>
                  </div>

                  {plan.duoPrice && (
                    <div
                      style={{
                        marginTop: 10,
                        display: 'inline-flex',
                        gap: 8,
                        alignItems: 'center',
                        background: plan.id === 'premium' ? 'rgba(202,163,74,0.12)' : 'rgba(0,0,0,0.04)',
                        border: plan.id === 'premium' ? '1px solid rgba(202,163,74,0.25)' : '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 12,
                        padding: '8px 10px',
                        fontWeight: 950,
                        color: plan.id === 'premium' ? '#8a6a1c' : '#111',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{formatUsd(plan.duoPrice)} for 2</span>
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: 900 }}>
                        (Save {formatUsd(plan.price * 2 - plan.duoPrice)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul style={{ textAlign: 'left', padding: 0, margin: '26px 0 18px', listStyle: 'none', flex: 1 }}>
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        fontSize: 13,
                        marginBottom: 12,
                        color: 'rgba(0,0,0,0.72)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontWeight: 750,
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ color: plan.color, fontSize: 14, lineHeight: 1.2 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                {/* Note */}
                {plan.note && (
                  <div
                    style={{
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 750,
                      color: 'rgba(0,0,0,0.45)',
                      background: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      padding: '10px 12px',
                      borderRadius: 14,
                      marginBottom: 18,
                    }}
                  >
                    {plan.note}
                  </div>
                )}

                {/* CTA */}
                <Link
                  href={`/customize?plan=${plan.id}`}
                  style={{
                    background: plan.id === 'premium' ? 'linear-gradient(180deg, #caa34a, #b08d35)' : plan.color,
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '18px',
                    borderRadius: 16,
                    fontWeight: 950,
                    fontSize: 15,
                    letterSpacing: '0.2px',
                    boxShadow: plan.id === 'premium' ? '0 10px 26px rgba(176,141,53,0.35)' : `0 10px 24px ${plan.color}22`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  {plan.cta} <span aria-hidden>→</span>
                </Link>

                <div style={{ marginTop: 14, fontSize: 11, fontWeight: 750, color: 'rgba(0,0,0,0.38)' }}>
                  Secure checkout powered by Stripe.
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 42, color: 'rgba(0,0,0,0.45)', fontSize: 12, fontWeight: 650, lineHeight: 1.6 }}>
          Digital products are final. Please confirm characters, script, and style before checkout.
        </div>
      </div>
    </div>
  );
}