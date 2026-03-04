/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ✅【新增】品牌資料集中管理
const BRAND = {
  name: 'TATTOO CLARITY STUDIO',
  email: 'info@tattooclarity.com',
  site: 'https://tattooclarity.com', // 記得改為你正式網址
  year: new Date().getFullYear(),
};

// 【1】全站 COPY 常量集中管理
const COPY = {
  hero: {
    kicker: 'STUDIO-READY. CULTURALLY REVIEWED.',
    // ✅✅ 升級 1：更高搜尋量主詞（H1）
    title1: 'Chinese Character Tattoo Generator',
    title2: 'Studio-Ready Designs.\nCulturally Reviewed.',
    sub1: 'Accurate. Balanced. Studio-ready.',
    sub2: 'Preview your Chinese tattoo design before you ink forever. Avoid mistranslations and poor stroke balance.',
    trustProof: 'Designed for real tattoo appointments',
    demoBtn: 'Preview My Character ↓',
    safe1: 'One-time payment. No subscription.',
    safe2: 'Instant delivery after payment.',
  },
  compare: {
    title: 'Engineered vs. Machine Fonts',
    subRed: 'What most people accidentally use.',
    subRest: "Don't let your skin become a typography mistake.",
    painPoint: 'Balanced stroke weight helps reduce blur and ink bleed on skin.',
    leftBadge: 'Most people accidentally use this',
  },
  mystery: {
    title: 'Feeling Bold? Try a Mystery Character.',
    sub: 'Selected from a culturally reviewed archive.',
    btn: 'Reveal What Awaits',
    btnSafe: 'Instant download • Meaning included',
    fateText: 'NOT RANDOM. ALIGNED.',
  },
  howItWorks: {
    title: 'How It Works',
    step1: { title: '1. Choose', desc: 'Pick a character (or Mystery)' },
    step2: { title: '2. Secure Checkout', desc: 'Checkout securely with Stripe' },
    step3: {
      title: '3. Instant Download',
      desc: 'Download 3000×3000px print-ready PNG (transparent) file instantly\n(PNG / SVG by plan)',
    },
  },
  deliverables: {
    title: 'What You Receive',
    item1: 'Transparent PNG',
    item2: '3000×3000px print-ready PNG (transparent)',
    item3: 'SVG (Premium)',
  },
  pricing: {
    title: 'Pricing Tiers',
    founding: 'Early launch pricing.',
    push: 'Most customers choose Standard',
    standardHighlight: 'Best for real tattoo appointments.',
    btnBasic: 'Get Basic',
    btnStandard: 'Get Standard (Best Value)',
    btnPremium: 'Get Premium',
  },
  faq: {
    replyTime: 'We typically reply within 1–2 business days.',
  },
};

// ✅ Download access days
const DOWNLOAD_ACCESS_DAYS = {
  basic: 15,
  standard: 30,
  premium: 45,
  mystery: 15,
} as const;

// ✅ safer markup: no nested divs inside a styled line container
const formatAccessLine = (days: number) => (
  <span>
    <span>Download access: {days} days</span>
    <span className="accessNote"> (expires after purchase)</span>
  </span>
);

// 🔥 Quick Preview keys
type SampleKey = 'strength' | 'love' | 'dragon' | 'blessing' | 'harmony' | 'eternal';

// 🔥 SAMPLES 資料
const SAMPLES = {
  strength: { label: 'Courage', meaning: 'Bravery / Fearless', char: '勇' },
  love: { label: 'Love', meaning: 'Love / Affection', char: '愛' },
  dragon: { label: 'Dragon', meaning: 'Mythical Dragon', char: '龍' },
  blessing: { label: 'Blessing', meaning: 'Blessings / Luck', char: '福' },
  harmony: { label: 'Harmony', meaning: 'Harmony / Balance', char: '和' },
  eternal: { label: 'Eternal', meaning: 'Everlasting', char: '永' },
} satisfies Record<SampleKey, { label: string; meaning: string; char: string }>;

// ✅ 用固定 array 控制 Quick Preview 顯示順序同數量 (6 個)
const QUICK_PICK_KEYS: SampleKey[] = ['strength', 'love', 'dragon', 'blessing', 'harmony', 'eternal'];

// 【0】定義 Hero Slider 圖片陣列
const HERO_SLIDES: Array<{
  id: number;
  src: string;
  alt: string;
  themeKey?: SampleKey;
}> = [
  { id: 1, src: '/hero/hero1.png', alt: 'Tattoo stencil clarity example and final result' },
  { id: 2, src: '/hero/hero2.png', alt: 'Tattoo artist applying dragon stencil to arm in studio', themeKey: 'dragon' },
];

// ✅ Flash designs
interface FlashDesign {
  char: string;
  name: string;
  vibe: string;
  themeKey: SampleKey;
}
const FLASH_DESIGNS: FlashDesign[] = [
  { char: SAMPLES.strength.char, name: 'COURAGE', vibe: 'Fearless Bravery.', themeKey: 'strength' },
  { char: SAMPLES.love.char, name: 'LOVE', vibe: 'Pure Affection.', themeKey: 'love' },
  { char: SAMPLES.dragon.char, name: 'DRAGON', vibe: 'Rising Dragon.', themeKey: 'dragon' },
  { char: SAMPLES.blessing.char, name: 'BLESSING', vibe: 'Blessing & Good Fortune.', themeKey: 'blessing' },
  { char: SAMPLES.harmony.char, name: 'HARMONY', vibe: 'Harmony & Balance.', themeKey: 'harmony' },
  { char: SAMPLES.eternal.char, name: 'ETERNAL', vibe: 'Everlasting.', themeKey: 'eternal' },
];

export default function Page() {
  const router = useRouter();
  const [sampleKey, setSampleKey] = useState<SampleKey>('dragon');
  const [currentSlide, setCurrentSlide] = useState(0);

  // ✅ footer/modal state 分離
  const [linkCopied, setLinkCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);

  // ✅ Contact Form States
  const [isContactOpen, setContactOpen] = useState(false);
  const [name, setName] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [hasClickedSend, setHasClickedSend] = useState(false);

  // ✅ Reset Contact Modal
  const openContact = () => {
    setContactOpen(true);
    setHasClickedSend(false);
    setSupportSubject('');
    setOrderNumber('');
    setMessage('');
    setMsgCopied(false);
  };

  const closeContact = () => {
    setContactOpen(false);
    setHasClickedSend(false);
    setMsgCopied(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const active = useMemo(() => SAMPLES[sampleKey], [sampleKey]);
  const sampleChar = active.char;
  const sampleMeaning = active.meaning;

  const scrollToPreview = () =>
    document.getElementById('fonts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleQuickPick = (key: SampleKey) => setSampleKey(key);

  const handleFlashClick = (themeKey: SampleKey) => {
    setSampleKey(themeKey);
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goCustomize = (plan: string, theme?: SampleKey, extra?: Record<string, string>) => {
    const qs = new URLSearchParams();
    qs.set('plan', plan);
    if (theme) qs.set('theme', theme);
    if (extra) Object.entries(extra).forEach(([k, v]) => qs.set(k, v));
    router.push(`/customize?${qs.toString()}`);
  };

  // ✅ Footer link copy function
  const copyToClipboard = async () => {
    if (typeof window === 'undefined') return;
    const text = window.location.href;
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setLinkCopied(true);
    }
    setTimeout(() => setLinkCopied(false), 1100);
  };

  const Price = ({
    amount,
    originalPrice,
    size = 'md',
    color = 'var(--gold)',
  }: {
    amount: string;
    originalPrice?: string;
    size?: 'md' | 'lg';
    color?: string;
  }) => {
    const main = size === 'lg' ? 70 : 54;
    const prefix = size === 'lg' ? 16 : 14;

    return (
      <div style={{ margin: '8px 0 6px' }}>
        <div
          style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '7px',
            color,
            fontVariantNumeric: 'lining-nums tabular-nums',
          }}
        >
          <span
            style={{
              fontSize: `${prefix}px`,
              marginTop: size === 'lg' ? '12px' : '8px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color,
            }}
          >
            US$
          </span>
          <span style={{ fontSize: `${main}px`, lineHeight: 1, color }}>{amount}</span>
        </div>

        {originalPrice && (
          <div
            style={{
              fontSize: 13,
              color: 'rgba(0,0,0,0.4)',
              textDecoration: 'line-through',
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            Regular ${originalPrice}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <style jsx global>{`
        :root {
          --bg: #fbf6ee;
          --card: #ffffff;
          --ink: #111;
          --muted: rgba(0, 0, 0, 0.62);
          --border: rgba(0, 0, 0, 0.08);
          --gold: #caa34a;
          --gold-antique: #b08d35;
          --red: #d9534f;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }

        @font-face {
          font-family: 'NotoSerifTC';
          src: url('/fonts/NotoSerifTC.ttf') format('truetype');
          font-weight: 400;
          font-display: swap;
        }

        @font-face {
          font-family: 'LXGWWenKai';
          src: url('/fonts/TC-StyleA-LXGWWenKai.ttf') format('truetype');
          font-weight: 400;
          font-display: swap;
        }

        #pricing,
        #fonts {
          scroll-margin-top: 90px;
        }

        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--ink);
          font-family: var(--font-inter, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif);
        }
        a {
          color: inherit;
          text-decoration: none;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 22px;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(251, 246, 238, 0.88);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
        }
        .headerInner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 180px;
        }
        .brand img {
          height: 60px;
          width: auto;
          display: block;
        }
        .topSpec {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.42);
          margin-right: 14px;
          white-space: nowrap;
          max-width: 420px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btnGold {
          border: 0;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 900;
          letter-spacing: 0.02em;
          background: linear-gradient(180deg, rgba(202, 163, 74, 0.98), rgba(202, 163, 74, 0.82));
          color: #1b1b1b;
          box-shadow: 0 10px 30px rgba(202, 163, 74, 0.18);
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .btnGold:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(202, 163, 74, 0.25);
          filter: brightness(1.03);
        }
        .btnGold:active {
          transform: translateY(1px) scale(0.98);
          filter: brightness(0.95);
        }

        .btnGoldWide {
          width: 100%;
          border: 0;
          cursor: pointer;
          padding: 16px 18px;
          border-radius: 16px;
          font-weight: 950;
          font-size: 16px;
          background: linear-gradient(180deg, rgba(202, 163, 74, 0.98), rgba(202, 163, 74, 0.82));
          color: #1b1b1b;
          box-shadow: 0 8px 24px rgba(202, 163, 74, 0.3);
          transition: all 0.2s ease;
        }
        .btnGoldWide:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(202, 163, 74, 0.4);
          filter: brightness(1.03);
        }
        .btnGoldWide:active {
          transform: translateY(1px) scale(0.98);
        }

        .hero {
          padding: 20px 0 10px;
        }
        .heroGrid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 24px;
          align-items: stretch;
        }
        .heroCard {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
        }

        .kicker {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.28em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .heroTitle {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          line-height: 1.1;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
          overflow-wrap: anywhere;
          word-break: break-word;
          hyphens: auto;
        }
        .heroTitleLine {
          display: block;
        }

        .heroTrustList {
          list-style: none;
          padding: 0;
          margin: 0 0 8px;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.65);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .heroTrustList li {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .heroTrustList span {
          color: var(--gold);
          font-size: 12px;
          font-weight: 900;
        }

        .demoBox {
          margin-top: 4px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          padding-top: 14px;
        }
        .label {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(0, 0, 0, 0.45);
          margin-bottom: 10px;
        }

        .quickPickRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }
        .quickPickBtn {
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          transition: all 0.2s;
        }
        .quickPickBtn:hover {
          border-color: var(--gold);
          color: var(--ink);
        }
        .quickPickBtn.active {
          background: var(--gold);
          border-color: var(--gold);
          color: #111;
          box-shadow: 0 4px 12px rgba(202, 163, 74, 0.3);
        }

        .row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 6px;
        }

        .ctaSafe {
          text-align: center;
          font-size: 11.5px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 6px;
        }

        .heroSliderContainer {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          background: #fff;
          height: 100%;
          min-height: 420px; /* ✅ FIX: prevent mobile from being too tall */
        }

        .heroSliderOverlay {
          position: absolute;
          inset: 0;
          background: transparent;
          border: none;
          z-index: 5;
          cursor: pointer;
          width: 100%;
          height: 100%;
          outline: none;
        }

        .heroSlide {
          position: absolute;
          inset: 0;
          transition: opacity 1s ease-in-out;
        }
        .heroSlide.active {
          opacity: 1;
          z-index: 1;
        }
        .heroSlide.inactive {
          opacity: 0;
          z-index: 0;
          pointer-events: none;
        }
        .heroSlideImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .heroBadge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(4px);
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.55);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          z-index: 10;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .heroMobileCta {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 12;
          display: none;
        }
        .heroMobileCta button {
          width: 100%;
          border: 0;
          cursor: pointer;
          padding: 14px 16px;
          border-radius: 14px;
          font-weight: 950;
          font-size: 15px;
          background: linear-gradient(180deg, rgba(202, 163, 74, 0.98), rgba(202, 163, 74, 0.82));
          color: #1b1b1b;
          box-shadow: 0 8px 20px rgba(202, 163, 74, 0.28);
        }

        .sectionGold {
          padding: 22px 0;
          background: var(--bg);
          border-top: none;
        }
        .sectionPlain {
          padding: 22px 0 28px;
          background: var(--bg);
          border-top: none;
        }

        .sectionTitle {
          font-family: 'Playfair Display', serif;
          font-size: 40px;
          letter-spacing: -0.02em;
          margin: 6px 0 6px;
          text-align: center;
        }

        .compareSubtitle {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 6px;
        }
        .compareSubtitle span {
          color: var(--red);
          font-weight: 800;
        }
        .comparePainPoint {
          text-align: center;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.5);
          margin-bottom: 24px;
        }

        .compareGrid2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          max-width: 920px;
          margin: 0 auto;
          align-items: stretch;
        }

        .compareCard {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 18px 18px 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .compareCard:hover {
          transform: scale(1.03);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
          z-index: 5;
          position: relative;
        }
        .compareCardGold {
          border-color: rgba(202, 163, 74, 0.35);
          box-shadow: 0 8px 24px rgba(202, 163, 74, 0.1);
        }
        .compareCardGold:hover {
          box-shadow: 0 16px 40px rgba(202, 163, 74, 0.18);
        }

        .compareTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
          position: relative;
        }
        .compareLabel {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.18em;
          color: rgba(0, 0, 0, 0.45);
          text-transform: uppercase;
        }
        .goldLabel {
          color: var(--gold);
        }
        .pill {
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          color: rgba(0, 0, 0, 0.55);
          background: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .pillGold {
          border-color: rgba(202, 163, 74, 0.45);
          color: #8a6a1c;
          background: rgba(202, 163, 74, 0.14);
        }

        .alertBadge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: #d9534f;
          background: rgba(217, 83, 79, 0.1);
          padding: 3px 6px;
          border-radius: 4px;
          margin-top: 4px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .authBadge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 800;
          color: #8a6a1c;
          background: rgba(202, 163, 74, 0.15);
          padding: 4px 8px;
          border-radius: 6px;
          margin-top: 8px;
          letter-spacing: 0.05em;
        }

        .previewBox {
          position: relative;
          border-radius: 16px;
          height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: rgba(251, 246, 238, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .previewBox::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.04) 0px,
            rgba(0, 0, 0, 0.04) 2px,
            transparent 2px,
            transparent 22px
          );
          opacity: 1;
          pointer-events: none;
        }

        .wmLayer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          user-select: none;
          filter: blur(0.3px);
        }
        .wmText {
          position: absolute;
          transform: rotate(-18deg);
          font-weight: 950;
          letter-spacing: 0.22em;
          color: rgba(0, 0, 0, 0.06);
          font-size: 12px;
          white-space: nowrap;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(1px);
        }
        .wmTextStrong {
          color: rgba(0, 0, 0, 0.09);
          background: rgba(255, 255, 255, 0.2);
        }

        .han {
          position: relative;
          z-index: 1;
          font-size: 92px;
          line-height: 1;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.78);
          filter: blur(1.1px);
          transform: translateY(2px);
          user-select: none;
        }

        .notoHan {
          font-family: 'NotoSerifTC', serif;
          font-weight: 600;
          font-size: 68px;
        }

        .wenHan {
          font-family: 'LXGWWenKai', serif;
          font-weight: 700;
          font-size: 72px;
        }

        .compareDesc {
          margin-top: 12px;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.55);
          text-align: center;
        }
        .descRed {
          color: var(--red);
          font-weight: 800;
          font-size: 13.5px;
        }

        .demoMeta {
          margin-top: 14px;
          text-align: center;
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.45);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .demoPromise {
          text-align: center;
          font-size: 12px;
          color: var(--gold);
          font-weight: 800;
          margin-top: 4px;
          letter-spacing: 0.02em;
        }
        .demoWarning {
          text-align: center;
          font-size: 10px;
          color: rgba(0, 0, 0, 0.35);
          font-weight: 700;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mysterySection {
          position: relative;
          padding: 24px 0 12px;
        }

        .mysteryWrap {
          max-width: 780px;
          margin: 0 auto;
          background: linear-gradient(135deg, #f2ece1 0%, #e6dfcf 100%);
          color: var(--ink);
          border-radius: 18px;

          --giftSize: 210px;
          --giftGap: 18px;

          padding: 22px 26px;

          box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.02), 0 16px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(180, 145, 60, 0.3);

          display: grid;
          grid-template-columns: var(--giftSize) 1fr;
          column-gap: var(--giftGap);
          align-items: center;

          position: relative;
          z-index: 2;
          text-align: center;
        }

        .mysteryWrap * {
          pointer-events: auto;
        }

        .mysteryWrap::before,
        .mysteryWrap::after {
          pointer-events: none !important;
        }

        .mysteryWrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.7) 0%, transparent 60%);
          z-index: 0;
          border-radius: inherit;
        }

        .mysteryWrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, transparent 40%, rgba(0, 0, 0, 0.04) 100%);
          z-index: 0;
          border-radius: inherit;
        }

        .mysteryGift {
          position: relative;
          z-index: 2;
          pointer-events: none;

          width: var(--giftSize);
          height: auto;

          display: flex;
          align-items: center;
          justify-content: center;

          filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.2));
        }

        .mysteryGift img {
          width: 100%;
          height: auto;
          display: block;
          transform-origin: center;
          animation: mysteryFloat 3.2s ease-in-out infinite;
        }

        @keyframes mysteryFloat {
          0% {
            transform: translateY(0) rotate(-1deg) scale(1);
          }
          50% {
            transform: translateY(-6px) rotate(1deg) scale(1.01);
          }
          100% {
            transform: translateY(0) rotate(-1deg) scale(1);
          }
        }

        .mysteryGift::before {
          content: '';
          position: absolute;
          width: 210px;
          height: 210px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(202, 163, 74, 0.22) 0%, rgba(202, 163, 74, 0) 65%);
          z-index: -1;
          filter: blur(3px);
        }

        .mysteryCenter {
          position: relative;
          z-index: 2;

          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

          gap: 5px;
        }

        .mysteryTitle {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 800;
          color: var(--gold-antique);
          margin: 0;
          letter-spacing: 0.02em;
          line-height: 1.12;
        }

        /* ✅ Mystery Pick: desktop inline */
        .mysteryPickBreak {
          display: inline;
        }

        .mysterySub {
          font-size: 14px;
          font-style: italic;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 2px;
          font-weight: 600;
        }

        .mysteryAction {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .mysteryPriceBox {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: -2px;
        }

        .mysteryFateInline {
          margin-top: 6px;
          font-size: 11px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.42);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          line-height: 1.2;
          white-space: nowrap;
          text-align: center;
          pointer-events: none !important;
        }

        .anchorPrice {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.45);
          text-decoration: line-through;
          font-weight: 800;
          margin-top: -2px;
          margin-bottom: -10px;
        }

        .btnMystery {
          position: relative;
          z-index: 2;
          border: 0;
          cursor: pointer;
          padding: 12px 28px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 15px;
          background: linear-gradient(180deg, var(--gold-antique), #967527);
          color: #fff;
          box-shadow: 0 8px 22px rgba(176, 141, 53, 0.28);
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
        }

        .btnMystery:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(176, 141, 53, 0.38);
          filter: brightness(1.05);
        }

        .btnMystery:active:not(:disabled) {
          transform: translateY(1px) scale(0.98);
        }

        .btnMysterySub {
          font-size: 11px;
          color: rgba(0, 0, 0, 0.5);
          font-weight: 700;
          margin-top: 6px;
          letter-spacing: 0.05em;
          width: 100%;
          text-align: center;
        }

        @media (max-width: 800px) {
          .mysteryWrap {
            grid-template-columns: 1fr;
            row-gap: 14px;
            padding: 22px 22px 26px;
            max-width: 560px;
          }

          .mysteryGift {
            width: 190px;
            margin: 0 auto;
          }
        }

        /* ✅✅ FIX #2：手機版置中 mystery CTA 區 (Reveal What Awaits + subline) */
        @media (max-width: 600px) {
          .mysteryAction {
            flex-direction: column;
            gap: 6px;
            align-items: center; /* ✅ */
            text-align: center; /* ✅ */
          }

          .btnMysterySub {
            text-align: center; /* ✅ 保險 */
          }

          /* 可選：讓按鈕唔好太細，保持居中好睇 */
          .btnMystery {
            min-width: min(320px, 100%);
          }
        }

        .howItWorksGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin: 0 auto 0;
          max-width: 900px;
        }
        .howItWorksCard {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
        }
        .hiwStep {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 800;
          color: var(--gold);
          margin-bottom: 8px;
        }
        .hiwDesc {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.65);
          font-weight: 500;
          line-height: 1.4;
          white-space: pre-line;
        }

        .flashHeader {
          text-align: center;
          margin: 16px 0 16px;
        }
        .flashGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin: 0 auto 36px;
          max-width: 1000px;
        }
        .flashCard {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .flashCard:hover {
          transform: scale(1.02) translateY(-4px);
          border-color: rgba(202, 163, 74, 0.4);
          box-shadow: 0 16px 32px rgba(202, 163, 74, 0.1);
          z-index: 5;
        }
        .flashCardHighlight {
          transform: scale(1.03);
          box-shadow: 0 12px 30px rgba(202, 163, 74, 0.15);
          border-color: rgba(202, 163, 74, 0.5);
          z-index: 2;
        }
        .flashCardHighlight:hover {
          transform: scale(1.05) translateY(-4px);
        }

        .flashChar {
          font-family: 'LXGWWenKai', serif;
          font-size: 64px;
          color: var(--ink);
          line-height: 1.1;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .flashName {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 6px;
          color: var(--gold);
        }
        .flashVibe {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 16px;
          line-height: 1.4;
          font-weight: 500;
          min-height: 36px;
        }
        .flashTrust {
          font-size: 10px;
          font-weight: 800;
          color: #5cb85c;
          background: rgba(92, 184, 92, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 16px;
          display: inline-block;
        }

        .btnFlash {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #f9f9f9;
          padding: 10px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          color: #111;
          margin-top: auto;
          transition: all 0.2s;
          font-family: inherit;
        }
        .flashCard:hover .btnFlash {
          background: var(--gold);
          color: #111;
          border-color: var(--gold);
          box-shadow: 0 4px 12px rgba(202, 163, 74, 0.2);
        }

        .pricingSub {
          text-align: center;
          font-size: 13px;
          font-weight: 900;
          color: var(--red);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-top: 0px;
          margin-bottom: 12px;
        }
        .pricingPush {
          display: block;
          width: fit-content;
          margin: 10px auto 22px;
          transform: translateY(-18px);
          text-align: center;

          font-size: 15px;
          font-weight: 800;
          color: var(--ink);
          background: rgba(202, 163, 74, 0.1);
          padding: 8px 18px;
          border-radius: 999px;

          position: relative;
          z-index: 3;
        }

        .priceGridAlignTop {
          margin-top: 10px;
        }

        .deliverablesTitle {
          font-size: 11px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 12px;
        }
        .deliverablesContainer {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .deliverableCard {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          padding: 6px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }
        .checkerBg {
          width: 20px;
          height: 20px;
          background-image: conic-gradient(
            rgba(0, 0, 0, 0.05) 25%,
            transparent 25%,
            transparent 50%,
            rgba(0, 0, 0, 0.05) 50%,
            rgba(0, 0, 0, 0.05) 75%,
            transparent 75%,
            transparent
          );
          background-size: 8px 8px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .deliverableText {
          font-size: 11px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .priceGridAlignTop {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          justify-content: center;
        }
        .priceCard {
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 22px 20px 18px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.05);
          position: relative;
          text-align: center;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
        }
        .priceCard:hover {
          transform: translateY(-4px);
        }
        .priceCardPop {
          border-color: rgba(202, 163, 74, 0.55);
          box-shadow: 0 20px 50px rgba(202, 163, 74, 0.15);
          transform: scale(1.05);
          z-index: 2;
          padding-top: 28px;
        }
        .priceCardPop:hover {
          transform: scale(1.05) translateY(-4px);
        }
        .priceCardSide {
          transform: translateY(24px);
        }

        .popBadge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--red);
          color: #fff;
          font-weight: 950;
          letter-spacing: 0.14em;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
          box-shadow: 0 8px 20px rgba(217, 83, 79, 0.3);
          white-space: nowrap;
        }

        .tier {
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.26em;
          color: rgba(0, 0, 0, 0.42);
          text-transform: uppercase;
          text-align: center;
          margin-top: 6px;
        }

        .standardHighlight {
          font-size: 12px;
          font-weight: 800;
          color: var(--gold);
          margin: 6px 0 8px;
        }

        .list {
          margin: 6px 0 12px;
          padding-left: 18px;
          color: rgba(0, 0, 0, 0.72);
          font-weight: 650;
          text-align: left;
          font-size: 13px;
          line-height: 1.4;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .list li {
          margin: 0;
        }

        .bundleLine {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.55);
          letter-spacing: 0.02em;
          min-height: 44px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 10px;
          padding: 6px 8px;
        }
        .bundleLine:hover {
          background: rgba(202, 163, 74, 0.08);
        }

        .btnOutline {
          width: 100%;
          border: 1.5px solid rgba(0, 0, 0, 0.15);
          background: transparent;
          padding: 14px 14px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.6);
          transition: all 0.2s;
        }
        .btnOutline:hover {
          border-color: rgba(0, 0, 0, 0.3);
          color: #111;
        }
        .btnSoft {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #fff;
          padding: 14px 14px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          color: #111;
          transition: all 0.2s;
        }
        .btnSoft:hover {
          border-color: rgba(0, 0, 0, 0.24);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .pricingSafeTop {
          text-align: center;
          font-size: 12px;
          color: var(--gold);
          font-weight: 800;
          margin-top: 36px;
          margin-bottom: 4px;
          letter-spacing: 0.02em;
        }
        .pricingSafeDesc {
          text-align: center;
          font-size: 11px;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 12px;
        }

        .downloadAccessLine {
          display: block;
          font-size: 11px;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.52);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin: 6px 0 12px;
        }

        .accessNote {
          font-size: 10px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.38);
          letter-spacing: 0.04em;
          margin-top: 2px;
          text-transform: none;
        }

        .faq {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
          max-width: 860px;
          margin-left: auto;
          margin-right: auto;
        }
        .faqItem {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          transition: box-shadow 0.2s;
        }
        .faqItem:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }
        .faqItem summary {
          cursor: pointer;
          font-weight: 950;
          font-size: 15px;
          outline: none;
        }
        .faqBody {
          margin-top: 8px;
          color: rgba(0, 0, 0, 0.65);
          line-height: 1.5;
          font-weight: 600;
          font-size: 14px;
        }

        .footer {
          border-top: 1px solid var(--border);
          padding: 30px 0 20px;
          background: var(--bg);
        }
        .footerGrid {
          display: grid;
          grid-template-columns: 1fr 1.4fr 1fr;
          gap: 14px;
          align-items: center;
        }
        .footerLinks {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          font-size: 12px;
          font-weight: 900;
          color: #141414;
          margin-bottom: 8px;
        }
        .footerFine {
          font-size: 10px;
          color: rgba(0, 0, 0, 0.45);
          line-height: 1.5;
          max-width: 520px;
          margin: 0 auto;
          text-align: center;
        }

        .footerContactBtn {
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 12px;
          font-weight: 900;
          color: #141414;
          cursor: pointer;
          transition: color 0.2s;
        }
        .footerContactBtn:hover {
          color: var(--gold);
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modalBox {
          background: #fff;
          width: 100%;
          max-width: 480px;
          border-radius: 20px;
          padding: 40px 36px;
          position: relative;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .closeBtn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.04);
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .closeBtn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #111;
        }

        .contactForm {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .formGroup {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .formLabel {
          font-size: 12px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .contactForm input,
        .contactForm select,
        .contactForm textarea {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 10px;
          padding: 12px 16px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          background: #fafafa;
          transition: border-color 0.2s;
          outline: none;
        }
        .contactForm input:focus,
        .contactForm select:focus,
        .contactForm textarea:focus {
          border-color: var(--gold);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(202, 163, 74, 0.1);
        }

        @media (max-width: 980px) {
          .topSpec {
            display: none;
          }

          .headerInner {
            padding: 10px 0;
            flex-wrap: wrap;
            gap: 10px;
          }
          .brand {
            min-width: 0;
          }
          .brand img {
            height: 44px;
            max-width: 180px;
          }
          .btnGold {
            padding: 10px 14px;
            font-size: 13px;
          }

          .hero {
            padding: 14px 0 8px;
          }
          .heroGrid {
            grid-template-columns: 1fr;
          }
          .heroCard {
            padding: 18px;
          }

          .heroTitle {
            font-size: 32px;
            line-height: 1.08;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .heroTrustList {
            font-size: 12.5px;
          }

          .heroSliderContainer {
            height: auto;
            min-height: 0;
            aspect-ratio: 16 / 11; /* ✅ FIX: shorter on mobile */
            max-height: 360px;     /* ✅ FIX: reduce tall hero */
          }
          .heroSlideImg {
            height: 100%;
            object-position: 50% 35%;
          }

          .heroSliderOverlay {
            display: none;
          }
          .heroMobileCta {
            display: block;
          }

          .heroMobileCta button {
            padding: 12px 14px;
            font-size: 14px;
            border-radius: 14px;
          }

          .compareGrid2 {
            grid-template-columns: 1fr;
          }

          .priceGridAlignTop {
            flex-direction: column;
            align-items: stretch;
          }
          .priceCardSide {
            transform: translateY(0);
          }
          .priceCardPop {
            transform: none;
            padding-top: 22px;
          }

          .flashGrid {
            grid-template-columns: 1fr 1fr;
          }
          .howItWorksGrid {
            grid-template-columns: 1fr;
          }

          .footerGrid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .footerLinks {
            flex-wrap: wrap;
          }

          /* ✅ footer right block align center on small screens */
          .footerRightAlign {
            align-items: center !important;
          }
        }

        @media (max-width: 520px) {
          .heroCustomizeBtn {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .wrap {
            padding: 0 16px;
          }

          .brand img {
            height: 40px;
            max-width: 150px;
          }

          .btnGold {
            padding: 9px 12px;
            font-size: 12.5px;
          }

          .heroTitle {
            font-size: clamp(26px, 6vw, 30px); /* ✅ FIX: nicer line wrapping */
          }

          .heroSliderContainer {
            aspect-ratio: 16 / 12; /* ✅ FIX: not 1:1, less tall */
            max-height: 320px;     /* ✅ FIX: shorter */
            border-radius: 20px;
          }

          .heroBadge {
            top: 10px;
            right: 10px;
            font-size: 8.5px;
          }

          /* ✅✅ FIX：手機版 Mystery Pick 強制拆行 */
          .mysteryPickBreak {
            display: block;
            margin-top: 2px;
          }

          .modalBox {
            padding: 28px 20px;
            border-radius: 16px;
          }
          .modalBox h3 {
            font-size: 22px !important;
          }
          .contactForm input,
          .contactForm select,
          .contactForm textarea {
            padding: 10px 14px;
            font-size: 13px;
          }
          .btnGoldWide {
            padding: 14px;
            font-size: 15px;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="header">
        <div className="wrap headerInner">
          <div className="brand">
            <img src="/logo-small.png" alt="TattooClarity" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="topSpec">STUDIO-GRADE • 3000×3000px print-ready PNG (transparent)</div>
            <button onClick={() => goCustomize('standard', sampleKey)} className="btnGold">
              GET STARTED
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="wrap heroGrid">
            <div className="heroCard">
              <div className="kicker">{COPY.hero.kicker}</div>
              <h1 className="heroTitle">
  <span className="heroTitleLine">{COPY.hero.title1}</span>

  {String(COPY.hero.title2)
    .split('\n')
    .map((line, i) => (
      <span key={i} className="heroTitleLine">
        {line}
      </span>
    ))}
</h1>

              <ul className="heroTrustList">
                <li>
                  <span>✔</span> Designed for studio workflows
                </li>
                <li>
                  <span>✔</span> 3000×3000px print-ready PNG (transparent) files
                </li>
                <li>
                  <span>✔</span> Culturally reviewed meanings
                </li>
                <li>
                  <span>✔</span> Traditional + Simplified Chinese (Mix per character — Premium)
                </li>
                <li>
                  <span>✔</span> Stroke-balanced for real tattoos
                </li>
              </ul>

              <div className="demoBox">
                <div className="label">Try a Quick Preview</div>
                <div className="quickPickRow">
                  {QUICK_PICK_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => handleQuickPick(key)}
                      className={`quickPickBtn ${sampleKey === key ? 'active' : ''}`}
                    >
                      {SAMPLES[key].label}
                    </button>
                  ))}
                </div>

                <div className="row">
                  <button onClick={scrollToPreview} className="btnGoldWide">
                    {COPY.hero.demoBtn}
                  </button>
                </div>

                <div className="ctaSafe">
                  {COPY.hero.safe1} <br />
                  <span>{COPY.hero.safe2}</span>
                </div>
              </div>
            </div>

            {/* HERO SLIDER */}
            <div className="heroSliderContainer">
              {HERO_SLIDES.map((slide, index) => (
                <div key={slide.id} className={`heroSlide ${index === currentSlide ? 'active' : 'inactive'}`}>
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="heroSlideImg"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
              ))}

              {/* Desktop click-through overlay */}
              <button
                type="button"
                className="heroSliderOverlay"
                onClick={() => {
                  const theme = HERO_SLIDES[currentSlide].themeKey ?? sampleKey;
                  goCustomize('standard', theme);
                }}
                aria-label="Customize this design"
              />

              {/* Mobile CTA (overlay is disabled on mobile) */}
              <div className="heroMobileCta">
                <button
                  className="heroCustomizeBtn"
                  type="button"
                  onClick={() => {
                    const theme = HERO_SLIDES[currentSlide].themeKey ?? sampleKey;
                    goCustomize('standard', theme);
                  }}
                  aria-label="Customize this design"
                >
                  Customize This Design
                </button>
              </div>

              <div className="heroBadge">AI Mockup • Results may vary</div>
            </div>
          </div>
        </section>

        {/* COMPARE / PREVIEW */}
        <section className="sectionGold" id="fonts">
          <div className="wrap">
            <h2 className="sectionTitle">{COPY.compare.title}</h2>
            <p className="compareSubtitle">
              <span>{COPY.compare.subRed}</span> {COPY.compare.subRest}
            </p>
            <p className="comparePainPoint">{COPY.compare.painPoint}</p>

            <div className="compareGrid2">
              {/* 1) Generic Machine Font demo */}
              <div className="compareCard">
                <div className="compareTop">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div className="compareLabel">Generic Machine Font</div>
                    <div className="alertBadge">{COPY.compare.leftBadge}</div>
                  </div>
                  <div className="pill" style={{ alignSelf: 'flex-start' }}>
                    Not Optimized
                  </div>
                </div>
                <div className="previewBox" style={{ marginTop: 8 }}>
                  <div className="wmLayer">
                    {[
                      { top: '18%', left: '-6%' },
                      { top: '42%', left: '12%' },
                      { top: '66%', left: '2%' },
                      { top: '30%', left: '52%' },
                      { top: '55%', left: '58%' },
                    ].map((p, idx) => (
                      <div key={idx} className={`wmText ${idx % 2 === 0 ? 'wmTextStrong' : ''}`} style={p}>
                        Copyright © {BRAND.year} {BRAND.name}
                      </div>
                    ))}
                  </div>
                  <div className="han notoHan" style={{ filter: 'blur(1.1px)' }}>
                    {sampleChar}
                  </div>
                </div>
                <div className="compareDesc descRed">Imbalanced strokes • Risk of blur on skin</div>
              </div>

              {/* 2) Optimized Stencil demo */}
              <div className="compareCard compareCardGold">
                <div className="compareTop">
                  <div className="compareLabel goldLabel" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                    Optimized Stencil
                  </div>
                  <div className="pill pillGold" style={{ alignSelf: 'flex-start' }}>
                    LXGW WENKAI
                  </div>
                </div>
                <div className="previewBox" style={{ background: 'rgba(255,250,240,0.78)', marginTop: 14 }}>
                  <div className="wmLayer">
                    {[
                      { top: '16%', left: '4%' },
                      { top: '40%', left: '-10%' },
                      { top: '62%', left: '10%' },
                      { top: '28%', left: '56%' },
                      { top: '54%', left: '52%' },
                      { top: '74%', left: '46%' },
                    ].map((p, idx) => (
                      <div key={idx} className={`wmText ${idx % 2 === 1 ? 'wmTextStrong' : ''}`} style={p}>
                        Copyright © {BRAND.year} {BRAND.name}
                      </div>
                    ))}
                  </div>
                  <div className="han wenHan" style={{ filter: 'blur(1px)' }}>
                    {sampleChar}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="authBadge">✔ Skin-tested clarity</div>
                  <br />
                  <div className="authBadge" style={{ marginTop: 4 }}>
                    ✔ Balanced stroke weight to prevent bleed
                  </div>
                </div>
              </div>
            </div>

            <div className="demoMeta">
              Demo Meaning: {sampleMeaning} • Character: {sampleChar}
            </div>
            <div className="demoPromise">Final file is delivered without watermark.</div>
            <div className="demoWarning">Preview is intentionally blurred to prevent misuse.</div>
          </div>
        </section>

        {/* FLASH DESIGNS */}
        <section className="sectionPlain" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <div className="flashHeader" id="flash">
              <h2 className="sectionTitle" style={{ fontSize: 36, marginBottom: 4 }}>
                Most Chosen Characters
              </h2>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'rgba(0,0,0,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Popular among early customers
              </p>
            </div>

            <div className="flashGrid">
              {FLASH_DESIGNS.map((item, idx) => (
                <div key={idx} className={`flashCard ${idx === 1 ? 'flashCardHighlight' : ''}`}>
                  <div className="flashChar">{item.char}</div>
                  <div className="flashName">{item.name}</div>
                  <div className="flashVibe">{item.vibe}</div>
                  <div className="flashTrust">✔ Studio-ready stencil included</div>
                  <button
                    onClick={() => handleFlashClick(item.themeKey)}
                    className="btnFlash"
                    style={{ display: 'block', textAlign: 'center', fontFamily: 'inherit' }}
                  >
                    Get This Design
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING TIERS */}
        <section className="sectionPlain" id="pricing" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div style={{ textAlign: 'center' }}>
              <h2 className="sectionTitle" style={{ marginTop: 0, marginBottom: '8px' }}>
                {COPY.pricing.title}
              </h2>
              <div className="pricingSub">{COPY.pricing.founding}</div>

              <div className="deliverablesTitle">{COPY.deliverables.title}</div>
              <div className="deliverablesContainer">
                <div className="deliverableCard">
                  <div className="checkerBg"></div>
                  <span className="deliverableText">{COPY.deliverables.item1}</span>
                </div>
                <div className="deliverableCard">
                  <span className="deliverableText" style={{ color: 'var(--gold)' }}>
                    ✦
                  </span>
                  <span className="deliverableText">{COPY.deliverables.item2}</span>
                </div>
                <div className="deliverableCard">
                  <span className="deliverableText" style={{ fontSize: 14 }}>
                    ⚡
                  </span>
                  <span className="deliverableText">{COPY.deliverables.item3}</span>
                </div>
              </div>

              <div className="pricingPush">{COPY.pricing.push}</div>
            </div>

            <div className="priceGridAlignTop">
              {/* BASIC */}
              <div className="priceCard priceCardSide">
                <div className="tier">BASIC</div>
                <Price amount="15" />
                <div className="downloadAccessLine">{formatAccessLine(DOWNLOAD_ACCESS_DAYS.basic)}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginBottom: 12, fontWeight: 600 }}>
                  Includes up to 2 Chinese characters (e.g., 勇 / 勇氣)
                </div>
                <ul className="list">
                  <li>✔ 1 curated calligraphy style</li>
                  <li>
                    ✔ 3000×3000px print-ready PNG
                    <br />
                    <span style={{ fontWeight: 900 }}>(solid background)</span>
                  </li>
                  <li>✔ 3 curated calligraphy options</li>
                  <li style={{ color: '#d9534f', fontWeight: 700 }}>✖ No stencil optimization</li>
                  <li style={{ color: '#d9534f', fontWeight: 700 }}>✖ No meaning explanation</li>
                </ul>
                <div style={{ marginTop: 'auto' }}>
                  <div
                    style={{
                      fontSize: 9.5,
                      color: 'rgba(0,0,0,0.45)',
                      marginBottom: 6,
                      lineHeight: 1.3,
                      fontWeight: 600,
                      padding: '0 4px',
                    }}
                  >
                    Meaning must be reviewed and approved before purchase.
                  </div>
                  <button
                    onClick={() => goCustomize('basic', sampleKey)}
                    className="btnOutline"
                    style={{ display: 'block', textAlign: 'center', fontFamily: 'inherit' }}
                  >
                    {COPY.pricing.btnBasic}
                  </button>
                </div>
              </div>

              {/* STANDARD */}
              <div className="priceCard priceCardPop">
                <div className="popBadge">MOST POPULAR</div>
                <div className="tier" style={{ marginTop: '12px' }}>
                  STANDARD
                </div>
                <div className="standardHighlight">{COPY.pricing.standardHighlight}</div>
                <Price amount="29" originalPrice="39" size="lg" />
                <div className="downloadAccessLine">{formatAccessLine(DOWNLOAD_ACCESS_DAYS.standard)}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginBottom: 16, fontWeight: 600 }}>
                  Includes up to 2 Chinese characters (e.g., 勇 / 勇氣)
                </div>

                <div
                  className="bundleLine"
                  role="button"
                  tabIndex={0}
                  onClick={() => goCustomize('standard', sampleKey, { bundle: 'duo', qty: '2', price: '50' })}
                >
                  <div style={{ fontWeight: 900, color: '#111', marginBottom: 4 }}>
                    DUO — 2 Sets (up to 4 characters total)
                  </div>
                  <div style={{ color: 'var(--gold)', fontWeight: 900, marginBottom: 2 }}>
                    Save 15%
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#111' }}>US$50</div>
                </div>

                <ul className="list">
                  <li>
                    ✔ 3000×3000px print-ready PNG
                    <br />
                    <span style={{ fontWeight: 900 }}>(transparent background)</span>
                  </li>
                  <li>✔ 3 curated calligraphy options</li>
                  <li>✔ Traditional Chinese only</li>
                  <li>✔ Artist-ready layout</li>
                  <li>✔ Meaning explanation included</li>
                </ul>

                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginBottom: 8, fontWeight: 700 }}>
                  Most customers choose DUO for flexibility.
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div
                    style={{
                      fontSize: 9.5,
                      color: 'rgba(0,0,0,0.45)',
                      marginBottom: 6,
                      lineHeight: 1.3,
                      fontWeight: 600,
                      padding: '0 4px',
                    }}
                  >
                    By completing payment, you confirm the character meaning has been reviewed and approved.
                  </div>
                  <button
                    onClick={() => goCustomize('standard', sampleKey)}
                    className="btnGoldWide"
                    style={{ display: 'block', textAlign: 'center', fontFamily: 'inherit' }}
                  >
                    {COPY.pricing.btnStandard}
                  </button>
                </div>
              </div>

              {/* PREMIUM */}
              <div className="priceCard priceCardSide">
                <div className="tier">PREMIUM</div>
                <Price amount="49" />
                <div className="downloadAccessLine">{formatAccessLine(DOWNLOAD_ACCESS_DAYS.premium)}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginBottom: 12, fontWeight: 600 }}>
                  Includes up to 2 Chinese characters (e.g., 勇 / 勇氣)
                </div>

                <div
                  className="bundleLine"
                  role="button"
                  tabIndex={0}
                  onClick={() => goCustomize('premium', sampleKey, { bundle: 'duo', qty: '2', price: '78' })}
                >
                  <div style={{ fontWeight: 900, color: '#111', marginBottom: 4 }}>
                    DUO — 2 Sets (up to 4 characters total)
                  </div>
                  <div style={{ color: 'var(--gold)', fontWeight: 900, marginBottom: 2 }}>
                    Save 15%
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#111' }}>US$78</div>
                </div>

                <ul className="list">
                  <li>✔ Traditional & Simplified Chinese</li>
                  <li>✔ Mix per character (Premium)</li>
                  <li>
                    ✔ <strong>SVG vector (unlimited scaling)</strong>
                  </li>
                  <li>✔ 3000×3000px print-ready PNG (transparent)</li>
                  <li>
                    ✔ <strong>Commercial studio use</strong>
                  </li>
                  <li>
                    ✔ <strong>Signature-ready layout</strong>
                  </li>
                  <li>✔ Advanced stroke refinement</li>
                </ul>

                <div style={{ marginTop: 'auto' }}>
                  <div
                    style={{
                      fontSize: 9.5,
                      color: 'rgba(0,0,0,0.45)',
                      marginBottom: 6,
                      lineHeight: 1.3,
                      fontWeight: 600,
                      padding: '0 4px',
                    }}
                  >
                    Meaning must be reviewed and approved before purchase.
                  </div>
                  <button
                    onClick={() => goCustomize('premium', sampleKey)}
                    className="btnSoft"
                    style={{ display: 'block', textAlign: 'center', fontFamily: 'inherit' }}
                  >
                    {COPY.pricing.btnPremium}
                  </button>
                </div>
              </div>
            </div>

            <div className="pricingSafeTop">Digital download • Instant access after payment</div>
            <div className="pricingSafeDesc">
              Download links expire after: Basic/Mystery {DOWNLOAD_ACCESS_DAYS.basic} days • Standard{' '}
              {DOWNLOAD_ACCESS_DAYS.standard} days • Premium {DOWNLOAD_ACCESS_DAYS.premium} days
              <br />
              Each set includes up to 2 characters (1 alternate allowed) • All digital sales are final
            </div>

            {/* MYSTERY BOX */}
            <div className="mysterySection" style={{ marginTop: 40 }}>
              <div className="mysteryWrap" id="mystery">
                <div className="mysteryGift" aria-hidden="true">
                  <img src="/images/mystery.png" alt="" />
                </div>

                <div className="mysteryCenter">
                  <h3 className="mysteryTitle">
                    <span style={{ display: 'block' }}>Choose something curated.</span>
                    <span style={{ display: 'block' }}>
                      Explore the <span className="mysteryPickBreak">Mystery Pick.</span>
                    </span>
                  </h3>
                  <p className="mysterySub">{COPY.mystery.sub}</p>

                  <div className="mysteryAction">
                    <div className="mysteryPriceBox">
                      <span className="anchorPrice">Studio consultation: $80+</span>
                      <Price amount="19" size="lg" color="var(--gold-antique)" />

                      <div className="mysteryFateInline" aria-hidden="true">
                        {COPY.mystery.fateText}
                      </div>

                      <div className="downloadAccessLine" style={{ marginTop: 8 }}>
                        {formatAccessLine(DOWNLOAD_ACCESS_DAYS.mystery)}
                      </div>
                    </div>

                    <div>
                      <button className="btnMystery" onClick={() => goCustomize('mystery')}>
                        {COPY.mystery.btn}
                      </button>
                      <div className="btnMysterySub">{COPY.mystery.btnSafe}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* HOW IT WORKS */}
            <h2 className="sectionTitle" style={{ marginTop: 60 }}>
              {COPY.howItWorks.title}
            </h2>
            <div className="howItWorksGrid">
              <div className="howItWorksCard">
                <div className="hiwStep">{COPY.howItWorks.step1.title}</div>
                <div className="hiwDesc">{COPY.howItWorks.step1.desc}</div>
              </div>
              <div className="howItWorksCard">
                <div className="hiwStep">{COPY.howItWorks.step2.title}</div>
                <div className="hiwDesc">{COPY.howItWorks.step2.desc}</div>
              </div>
              <div className="howItWorksCard">
                <div className="hiwStep">{COPY.howItWorks.step3.title}</div>
                <div className="hiwDesc">{COPY.howItWorks.step3.desc}</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="sectionGold">
          <div className="wrap">
            <h2 className="sectionTitle">Common Questions</h2>
            <div className="faq">
              {/* ✅✅ 升級 2：新增 3 條 SEO FAQ（放最上面） */}
              <details className="faqItem" open>
                <summary>Is it safe to get a Chinese character tattoo?</summary>
                <div className="faqBody">
                  It can be safe and meaningful — but the biggest risks are <strong>wrong meaning</strong>,{' '}
                  <strong>awkward wording</strong>, and <strong>poor stroke balance</strong> that blurs over time.
                  <br />
                  We focus on culturally reviewed meanings and studio-ready layout so artists can work cleanly.
                </div>
              </details>

              <details className="faqItem">
                <summary>What does my Chinese tattoo really mean?</summary>
                <div className="faqBody">
                  A single character can carry multiple nuances depending on context.
                  <br />
                  That’s why our meanings are curated by native Chinese speakers, and we recommend{' '}
                  <strong>single-character concepts</strong> for clarity.
                </div>
              </details>

              <details className="faqItem">
                <summary>Are Chinese tattoos often mistranslated?</summary>
                <div className="faqBody">
                  Yes — many people rely on machine translation or random fonts. Common mistakes include{' '}
                  <strong>wrong character choice</strong>, <strong>unnatural phrasing</strong>, or{' '}
                  <strong>inaccurate “cool-sounding” meanings</strong>.
                  <br />
                  Our designs are reviewed for meaning and optimized for tattoo readability.
                </div>
              </details>

              {/* 你原本的 FAQ 內容（完全保留） */}
              <details className="faqItem">
                <summary>How many characters are included?</summary>
                <div className="faqBody">
                  Each purchase includes up to 2 Chinese characters per set.
                  <br />
                  One alternate version is allowed (e.g., 勇 / 勇氣). For longer phrases, purchase multiple sets.
                </div>
              </details>

              <details className="faqItem">
                <summary>What do I receive after payment?</summary>
                <div className="faqBody">
                  You will receive a high-resolution stencil file based on your plan.
                  <br />
                  <strong>Standard & Premium:</strong> 3000×3000px transparent-background PNG (print-ready).
                  <br />
                  <strong>Premium:</strong> includes an SVG vector file for unlimited scaling.
                </div>
              </details>

              <details className="faqItem">
                <summary>How will I get my files?</summary>
                <div className="faqBody">
                  After successful payment, your files are available on the confirmation page and sent to your checkout email.
                </div>
              </details>

              <details className="faqItem">
                <summary>Do download links expire?</summary>
                <div className="faqBody">
                  Yes. Download access is limited by plan:
                  <br />
                  Basic/Mystery: {DOWNLOAD_ACCESS_DAYS.basic} days • Standard: {DOWNLOAD_ACCESS_DAYS.standard} days • Premium:{' '}
                  {DOWNLOAD_ACCESS_DAYS.premium} days
                  <br />
                  After expiry, links are no longer accessible.
                </div>
              </details>

              <details className="faqItem">
                <summary>Can you send the files to a different email?</summary>
                <div className="faqBody">
                  For security and verification, files can only be delivered or resent to the same email used at checkout.
                </div>
              </details>

              <details className="faqItem">
                <summary>What if the download link doesn’t work?</summary>
                <div className="faqBody">
                  Contact support using the payment email and include your Stripe receipt. We typically reply within 1–2 business
                  days.
                </div>
              </details>

              <details className="faqItem">
                <summary>Will my tattoo artist accept this?</summary>
                <div className="faqBody">
                  Files are designed to be artist-friendly and suitable for studio workflows. Final approval depends on the tattoo
                  artist’s preferences.
                </div>
              </details>

              <details className="faqItem">
                <summary>Is the meaning accurate?</summary>
                <div className="faqBody">
                  Meanings are curated by native Chinese speakers. For best results, we recommend single-character concepts.
                </div>
              </details>

              <details className="faqItem">
                <summary>Meaning Confirmation</summary>
                <div className="faqBody">
                  By completing checkout, you confirm that you have reviewed and approved the character meaning before purchase.
                  <br />
                  <br />
                  Characters are provided as single-character concepts, and interpretations may vary by context. Please ensure the
                  meaning aligns with your personal intention before tattooing.
                </div>
              </details>

              <details className="faqItem">
                <summary>Refund policy</summary>
                <div className="faqBody">
                  All sales are final for digital downloads. If there is a file issue or character error from our side, we will correct
                  and resend.
                </div>
              </details>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
            <a href={`mailto:${BRAND.email}`} style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/social/email.png" alt="Email Us" style={{ height: 22 }} />
            </a>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                src="/social/link.png"
                alt="Copy Link"
                onClick={copyToClipboard}
                style={{ height: 22, cursor: 'pointer' }}
              />
              {linkCopied && (
                <span
                  style={{
                    position: 'absolute',
                    top: 28,
                    fontSize: 9,
                    fontWeight: 950,
                    color: 'var(--gold)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  COPIED ✓
                </span>
              )}
            </div>
          </div>

          <div className="footerGrid">
            <div style={{ fontSize: 11, fontWeight: 900, color: '#141414', letterSpacing: '0.05em' }}>
              © {BRAND.year} {BRAND.name}
              <br />
              <span
                style={{
                  color: 'rgba(0,0,0,0.5)',
                  marginTop: 6,
                  display: 'inline-block',
                  lineHeight: 1.5,
                }}
              >
                {BRAND.email}
                <br />
                For studio licensing inquiries, contact us.
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div className="footerLinks">
                <Link href="/terms" style={{ color: '#141414', textDecoration: 'none' }}>
                  Terms
                </Link>
                <span style={{ color: 'rgba(0,0,0,0.25)' }}>•</span>
                <Link href="/privacy" style={{ color: '#141414', textDecoration: 'none' }}>
                  Privacy
                </Link>
                <span style={{ color: 'rgba(0,0,0,0.25)' }}>•</span>
                <Link href="/refund" style={{ color: '#141414', textDecoration: 'none' }}>
                  Refund Policy
                </Link>
                <span style={{ color: 'rgba(0,0,0,0.25)' }}>•</span>
                <button onClick={openContact} className="footerContactBtn">
                  Contact Us
                </button>
              </div>
              <div className="footerFine">
                Product images are AI-generated mockups for visual guidance only.
                <br />
                All sales are final on digital downloads. Download links expire by plan.
              </div>
            </div>

            <div
              className="footerRightAlign"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}
            >
              <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: '0.05em' }}>
                Secure payment powered by Stripe.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {['visa', 'mastercard', 'amex', 'applepay', 'googlepay'].map((card) => (
                  <img key={card} src={`/payments/${card}.png`} alt={card} style={{ height: 18 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CONTACT MODAL */}
      {isContactOpen && (
        <div className="modalOverlay" onClick={closeContact}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <button className="closeBtn" onClick={closeContact}>
              ✕
            </button>

            <h3
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 26,
                marginTop: 0,
                marginBottom: 6,
                color: 'var(--ink)',
              }}
            >
              Support Request
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              This opens your email app with a pre-filled message.
            </p>

            <div className="contactForm">
              <div className="formGroup">
                <label className="formLabel">Your Name</label>
                <input type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="formGroup">
                <label className="formLabel">Subject / Inquiry Type</label>
                <select value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)}>
                  <option value="" disabled>
                    Select an inquiry type...
                  </option>
                  <option value="Order Support">Order Support (Include Order #)</option>
                  <option value="File Access">File Access / Download Issue</option>
                  <option value="Studio Inquiry">Studio / Commercial Inquiry</option>
                  <option value="General Question">General Question</option>
                </select>
              </div>

              {((supportSubject || '').includes('Order') || (supportSubject || '').includes('File')) && (
                <div className="formGroup" style={{ animation: 'fadeIn 0.3s' }}>
                  <label className="formLabel" style={{ color: 'var(--gold)' }}>
                    Order Number
                  </label>
                  <input
                    type="text"
                    placeholder="#12345"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
              )}

              <div className="formGroup">
                <label className="formLabel">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help you today?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                className="btnGoldWide"
                style={{ marginTop: 10, padding: '16px' }}
                onClick={() => {
                  setHasClickedSend(true);

                  const finalSubject = `[TATTOO CLARITY] ${supportSubject || 'Inquiry'}`;

                  const bodyLines = [
                    `Customer Name: ${name?.trim() || 'Not provided'}`,
                    `Inquiry Type: ${supportSubject || 'General'}`,
                    orderNumber?.trim() ? `Order Number: ${orderNumber.trim()}` : '',
                    `------------------------------------`,
                    `Message:`,
                    (message || '').trim(),
                    `------------------------------------`,
                    `Sent from: ${BRAND.name}`,
                  ]
                    .filter(Boolean)
                    .join('\n');

                  const mailtoLink =
                    `mailto:${BRAND.email}` +
                    `?subject=${encodeURIComponent(finalSubject)}` +
                    `&body=${encodeURIComponent(bodyLines)}`;

                  if (mailtoLink.length > 1800) {
                    alert('Your message is long. If the email body looks cut off, use "Copy Message Text" as a backup.');
                  }

                  window.location.href = mailtoLink;
                }}
              >
                Open Email App
              </button>

              {hasClickedSend && (
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '11.5px',
                    color: 'var(--red)',
                    fontWeight: 800,
                    marginTop: '6px',
                    animation: 'fadeIn 0.4s ease',
                  }}
                >
                  Email app didn&apos;t open? Please use the copy button below.
                </div>
              )}

              <button
                onClick={async () => {
                  const finalSubject = `[TATTOO CLARITY] ${supportSubject || 'Inquiry'}`;
                  const bodyLines = [
                    `Customer Name: ${name?.trim() || 'Not provided'}`,
                    `Inquiry Type: ${supportSubject || 'General'}`,
                    orderNumber?.trim() ? `Order Number: ${orderNumber.trim()}` : '',
                    `Message:`,
                    (message || '').trim(),
                  ]
                    .filter(Boolean)
                    .join('\n');

                  const textToCopy = `${finalSubject}\n\n${bodyLines}`;

                  try {
                    await navigator.clipboard.writeText(textToCopy);
                    setMsgCopied(true);
                    setTimeout(() => setMsgCopied(false), 1500);
                  } catch {
                    const ta = document.createElement('textarea');
                    ta.value = textToCopy;
                    ta.style.position = 'fixed';
                    ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    try {
                      document.execCommand('copy');
                      setMsgCopied(true);
                      setTimeout(() => setMsgCopied(false), 1500);
                    } finally {
                      document.body.removeChild(ta);
                    }
                  }
                }}
                style={{
                  background: 'none',
                  border: '1px dashed var(--border)',
                  padding: '10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 800,
                  color: 'var(--muted)',
                  marginTop: 10,
                }}
              >
                {msgCopied ? 'Copied to Clipboard! ✓' : 'Alternative: Copy Message Text'}
              </button>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: 'rgba(0,0,0,0.4)',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                Recipient: {BRAND.email}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}