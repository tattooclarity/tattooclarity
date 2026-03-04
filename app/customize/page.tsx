/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useMemo, useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface CharacterOption {
  label: string;
  tradChar: string;
  simpChar: string;
  tradPhrase: string;
  simpPhrase: string;
  meaning: string;
}

interface Theme {
  id: string;
  name: string;
  isExclusive?: boolean; // Premium 專屬
  options: CharacterOption[];
}

// ✅ PickChoice：每一粒 Pick 用 Stable ID
type PickChoice = {
  id: string; // ✅ 永遠唔變嘅唯一 ID
  key: string;
  themeId: string;
  option: CharacterOption;
  script: 'traditional' | 'simplified';
  usePhrase: boolean;
  fontId: string;
};

const THEMES: Theme[] = [
  {
    id: 'strength',
    name: 'STRENGTH',
    options: [
      { label: 'Courage', tradChar: '勇', simpChar: '勇', tradPhrase: '勇敢', simpPhrase: '勇敢', meaning: 'Fearless Bravery' },
      { label: 'Power', tradChar: '力', simpChar: '力', tradPhrase: '力量', simpPhrase: '力量', meaning: 'Raw Strength' },
      { label: 'Endurance', tradChar: '忍', simpChar: '忍', tradPhrase: '忍耐', simpPhrase: '忍耐', meaning: 'Endurance & Self-Control' },
    ],
  },
  {
    id: 'love',
    name: 'LOVE',
    options: [
      { label: 'Love', tradChar: '愛', simpChar: '爱', tradPhrase: '愛意', simpPhrase: '爱意', meaning: 'Pure Affection' },
      { label: 'Heart', tradChar: '心', simpChar: '心', tradPhrase: '真心', simpPhrase: '真心', meaning: 'Sincere Heart' },
      { label: 'Compassion', tradChar: '慈', simpChar: '慈', tradPhrase: '慈愛', simpPhrase: '慈爱', meaning: 'Gentle Compassion' },
    ],
  },
  {
    id: 'dragon',
    name: 'DRAGON',
    options: [
      { label: 'Dragon', tradChar: '龍', simpChar: '龙', tradPhrase: '龍騰', simpPhrase: '龙腾', meaning: 'Rising Dragon' },
      { label: 'Majesty', tradChar: '威', simpChar: '威', tradPhrase: '威武', simpPhrase: '威武', meaning: 'Authority & Presence' },
      { label: 'Flying', tradChar: '飛', simpChar: '飞', tradPhrase: '飛龍', simpPhrase: '飞龙', meaning: 'Soaring High' },
    ],
  },
  {
    id: 'fortune',
    name: 'FORTUNE',
    options: [
      { label: 'Blessing', tradChar: '福', simpChar: '福', tradPhrase: '福氣', simpPhrase: '福气', meaning: 'Blessing & Good Fortune' },
      { label: 'Wealth', tradChar: '財', simpChar: '财', tradPhrase: '財富', simpPhrase: '财富', meaning: 'Abundant Prosperity' },
      { label: 'Luck', tradChar: '運', simpChar: '运', tradPhrase: '好運', simpPhrase: '好运', meaning: 'Good Fortune' },
    ],
  },
  {
    id: 'balance',
    name: 'BALANCE',
    options: [
      { label: 'Harmony', tradChar: '和', simpChar: '和', tradPhrase: '和諧', simpPhrase: '和谐', meaning: 'Harmony & Balance' },
      { label: 'Stillness', tradChar: '靜', simpChar: '静', tradPhrase: '靜心', simpPhrase: '静心', meaning: 'Inner Calm' },
      { label: 'Peace', tradChar: '安', simpChar: '安', tradPhrase: '平安', simpPhrase: '平安', meaning: 'Peace & Safety' },
    ],
  },
  {
    id: 'serenity',
    name: 'SERENITY',
    options: [
      { label: 'Clarity', tradChar: '清', simpChar: '清', tradPhrase: '清心', simpPhrase: '清心', meaning: 'Clear Mind' },
      { label: 'Gentle', tradChar: '柔', simpChar: '柔', tradPhrase: '柔和', simpPhrase: '柔和', meaning: 'Soft Strength' },
      { label: 'Equanimity', tradChar: '淡', simpChar: '淡', tradPhrase: '淡然', simpPhrase: '淡然', meaning: 'Calm, Balanced Mind' },
    ],
  },
  {
    id: 'rise',
    name: 'RISE',
    options: [
      { label: 'Rise', tradChar: '升', simpChar: '升', tradPhrase: '高升', simpPhrase: '高升', meaning: 'Steady Ascent' },
      { label: 'Leap', tradChar: '躍', simpChar: '跃', tradPhrase: '躍進', simpPhrase: '跃进', meaning: 'Leap Forward' },
      { label: 'Soar', tradChar: '翔', simpChar: '翔', tradPhrase: '飛翔', simpPhrase: '飞翔', meaning: 'Soaring Flight' },
    ],
  },
  {
    id: 'legacy',
    name: 'LEGACY',
    options: [
      { label: 'Eternal', tradChar: '永', simpChar: '永', tradPhrase: '永恆', simpPhrase: '永恒', meaning: 'Everlasting' },
      { label: 'Origin', tradChar: '源', simpChar: '源', tradPhrase: '本源', simpPhrase: '本源', meaning: 'Root Source' },
      { label: 'Heritage', tradChar: '傳', simpChar: '传', tradPhrase: '傳承', simpPhrase: '传承', meaning: 'Honored Legacy' },
    ],
  },
  {
    id: 'honor',
    name: 'HONOR',
    options: [
      { label: 'Virtue', tradChar: '德', simpChar: '德', tradPhrase: '德行', simpPhrase: '德行', meaning: 'Noble Character' },
      { label: 'Faith', tradChar: '信', simpChar: '信', tradPhrase: '信念', simpPhrase: '信念', meaning: 'Unwavering Belief' },
      { label: 'Justice', tradChar: '義', simpChar: '义', tradPhrase: '正義', simpPhrase: '正义', meaning: 'Righteousness' },
    ],
  },
  {
    id: 'healthy',
    name: 'HEALTHY',
    options: [
      { label: 'Health', tradChar: '健', simpChar: '健', tradPhrase: '健康', simpPhrase: '健康', meaning: 'Vibrant Health' },
      { label: 'Wellbeing', tradChar: '康', simpChar: '康', tradPhrase: '安康', simpPhrase: '安康', meaning: 'Peaceful Wellbeing' },
      { label: 'Longevity', tradChar: '壽', simpChar: '寿', tradPhrase: '長壽', simpPhrase: '长寿', meaning: 'Enduring Longevity' },
    ],
  },

  // Premium exclusive
  {
    id: 'limitless',
    name: '無極 · LIMITLESS',
    isExclusive: true,
    options: [
      { label: 'Limitless', tradChar: '無極', simpChar: '无极', tradPhrase: '無極', simpPhrase: '无极', meaning: 'Boundless Potential' },
      { label: 'Void', tradChar: '虛空', simpChar: '虚空', tradPhrase: '虛空', simpPhrase: '虚空', meaning: 'The Infinite Beyond' },
      { label: 'Prime', tradChar: '太初', simpChar: '太初', tradPhrase: '太初', simpPhrase: '太初', meaning: 'Primordial Origin' },
    ],
  },
  {
    id: 'freedom',
    name: '自在 · FREEDOM',
    isExclusive: true,
    options: [
      { label: 'Freedom', tradChar: '自在', simpChar: '自在', tradPhrase: '自在', simpPhrase: '自在', meaning: 'Inner Freedom' },
      { label: 'Carefree', tradChar: '逍遙', simpChar: '逍遥', tradPhrase: '逍遙', simpPhrase: '逍遥', meaning: 'Carefree Spirit' },
      { label: 'Fate', tradChar: '隨緣', simpChar: '随缘', tradPhrase: '隨緣', simpPhrase: '随缘', meaning: 'Embrace Destiny' },
    ],
  },
  {
    id: 'vitality',
    name: '元氣 · VITALITY',
    isExclusive: true,
    options: [
      { label: 'Vitality', tradChar: '元氣', simpChar: '元气', tradPhrase: '元氣', simpPhrase: '元气', meaning: 'Life Force' },
      { label: 'True Qi', tradChar: '真氣', simpChar: '真气', tradPhrase: '真氣', simpPhrase: '真气', meaning: 'True Essence' },
      { label: 'Aura', tradChar: '靈氣', simpChar: '灵气', tradPhrase: '靈氣', simpPhrase: '灵气', meaning: 'Spiritual Energy' },
    ],
  },
];

const FONT_STYLES = [
  { id: 'trad-A', label: 'TRADITIONAL · STYLE A', css: '"TC-A", serif' },
  { id: 'trad-B', label: 'TRADITIONAL · STYLE B', css: '"TC-B", serif' },
  { id: 'trad-C', label: 'TRADITIONAL · STYLE C', css: '"TC-C", sans-serif' },
  { id: 'simp-A', label: 'SIMPLIFIED · STYLE A', css: '"SC-A", serif' },
  { id: 'simp-B', label: 'SIMPLIFIED · STYLE B', css: '"SC-B", serif' },
  { id: 'simp-C', label: 'SIMPLIFIED · STYLE C', css: '"SC-C", sans-serif' },
];

const INITIAL_POS = {
  male: { x: 26.1, y: 72.9, rotate: -10, scale: 1.0 },
  female: { x: 90.0, y: 21.9, rotate: 8, scale: 1.0 },
};

const ARM_LIMIT = {
  male: { minX: 10, maxX: 90, minY: 10, maxY: 90 },
  female: { minX: 10, maxX: 90, minY: 10, maxY: 90 },
};

const PACKAGE_DATA: Record<
  string,
  { price: number; duoPrice?: number; subtitle: string; tagline: string; features: string[] }
> = {
  basic: { price: 15, subtitle: 'Quick Preview', tagline: 'For quick check', features: ['1 style', 'Standard PNG'] },
  standard: {
    price: 29,
    duoPrice: 50,
    subtitle: 'Most Popular',
    tagline: 'Perfect for 2 placements',
    features: ['300 DPI ready', '3 options', 'Transparent bg', 'Artist layout'],
  },
  premium: {
    price: 49,
    duoPrice: 78,
    subtitle: 'Professional Choice',
    tagline: 'For studios / scaling',
    features: ['Vector SVG', 'Unlimited scale', 'Master file', 'Studio license'],
  },
  mystery: {
    price: 19,
    subtitle: 'Surprise Reveal',
    tagline: 'Curated — not random',
    features: ['Curated mystery pick (not random)', 'Revealed after payment'],
  },
};

const ARM_CLICKS_TO_HIDE = 3;
const HIDE_AFTER_MS = 5000;

// ✅ FIXED 1: Safer slugify function (use hyphens, strip others)
// e.g. "True Qi" -> "true-qi", "Prime" -> "prime"
const toSlug = (s: string) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces/symbols with hyphen
    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens

// ✅ FIXED 2: Granular metadata extraction
const pickToMeta = (p: PickChoice) => {
  const theme = p.themeId;                 // e.g. "dragon"
  const label = toSlug(p.option.label);    // e.g. "flying"
  const lang = p.script === 'simplified' ? 'sc' : 'tc';
  const letter = (p.fontId.match(/-(A|B|C)$/i)?.[1] || 'A').toUpperCase();
  
  // Backend often prefers just "A" or "B", but frontend might use "SA"/"SB".
  // We send BOTH to be 100% safe.
  const style = `S${letter}`;   // Legacy support: "SA", "SB"
  const styleLetter = letter;   // ✅ Backend safe: "A", "B", "C"
  
  const type = p.usePhrase ? 'phrase' : 'single';
  
  return { 
    theme, 
    label, 
    lang, 
    style, 
    styleLetter, // New field
    type,
    fontId: p.fontId // Also useful
  };
};

function CustomizeContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const planParam = sp.get('plan');
  const themeParam = sp.get('theme');

  const debugParam = sp.get('debug');
  const isDebugMode = debugParam === '1';

  const [currentPlan, setCurrentPlan] = useState((planParam || 'standard').toLowerCase());
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);

  const [picked, setPicked] = useState<PickChoice[]>(() => {
    const t0 = THEMES[0];
    const o0 = t0.options[0];
    return [
      {
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        key: `${t0.id}:${o0.label}:traditional:char`,
        themeId: t0.id,
        option: o0,
        script: 'traditional',
        usePhrase: false,
        fontId: 'trad-A',
      },
    ];
  });

  const [showPhrase, setShowPhrase] = useState(false);
  const [layoutByArm, setLayoutByArm] = useState<{ male: 'horizontal' | 'vertical'; female: 'horizontal' | 'vertical' }>({
    male: 'horizontal',
    female: 'horizontal',
  });

  const [bundle, setBundle] = useState<'single' | 'duo'>('duo');
  const [pos, setPos] = useState(INITIAL_POS);

  const [showAdjust, setShowAdjust] = useState(false);
  const [activeArm, setActiveArm] = useState<'male' | 'female'>('male');

  const [debugOverlay, setDebugOverlay] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  const [tipMode, setTipMode] = useState<'invite' | 'howto' | 'hidden'>('invite');
  const [armClicks, setArmClicks] = useState(0);
  const hideTimerRef = useRef<number | null>(null);

  const didInitThemeRef = useRef(false);
  const [confirmed, setConfirmed] = useState(false);
  const [armPickIndex, setArmPickIndex] = useState<{ male: number; female: number }>({ male: 0, female: 1 });

  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => setConfirmed(false), [currentPlan, activeTheme, picked, showPhrase, layoutByArm, bundle]);

  const scheduleHide = (ms: number) => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setTipMode('hidden'), ms);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const isPremium = currentPlan === 'premium';
  const isMystery = currentPlan === 'mystery';

  const detail = PACKAGE_DATA[currentPlan] || PACKAGE_DATA.standard;

  const canDuo = !!detail?.duoPrice && (currentPlan === 'standard' || currentPlan === 'premium');
  const unitPrice = detail?.price || 19;
  const duoPrice = detail?.duoPrice ?? 0;

  // ✅ 更強版本：計算 save 只係 duo 先有
  const saveAmt = canDuo && bundle === 'duo' ? unitPrice * 2 - duoPrice : 0;

  const displayPrice = canDuo && bundle === 'duo' ? duoPrice : unitPrice;

  const availableThemes = useMemo(() => {
    if (currentPlan === 'basic') return THEMES.slice(0, 7);
    if (currentPlan === 'standard') return THEMES.slice(0, 10);
    return THEMES;
  }, [currentPlan]);

  useEffect(() => {
    if (didInitThemeRef.current) return;
    if (!themeParam || availableThemes.length === 0) return;
    const foundTheme = availableThemes.find((t) => t.id.toLowerCase() === themeParam.toLowerCase());
    if (foundTheme) setActiveTheme(foundTheme);
    didInitThemeRef.current = true;
  }, [themeParam, availableThemes]);

  useEffect(() => {
    const ok = availableThemes.some((t) => t.id === activeTheme.id);
    if (!ok) setActiveTheme(availableThemes[0]);
  }, [availableThemes, activeTheme.id]);

  useEffect(() => setCurrentPlan((planParam || 'standard').toLowerCase()), [planParam]);

  useEffect(() => {
    const enableDuo = !!PACKAGE_DATA[currentPlan]?.duoPrice && (currentPlan === 'standard' || currentPlan === 'premium');
    setBundle(enableDuo ? 'duo' : 'single');
  }, [currentPlan]);

  useEffect(() => {
    if (isPremium) return;
    setPicked((prev) =>
      prev.map((p) => {
        if (p.script === 'traditional') return p;
        const m = p.fontId.match(/-(A|B|C)$/i);
        const letter = (m?.[1] || 'A').toUpperCase();
        const nextFontId = 'trad-' + letter;
        const newKey = `${p.themeId}:${p.option.label}:traditional:${p.usePhrase ? 'phrase' : 'char'}`;
        return { ...p, script: 'traditional', fontId: nextFontId, key: newKey };
      })
    );
  }, [isPremium]);

  useEffect(() => {
    const allowed = new Set(availableThemes.map((t) => t.id));
    setPicked((prev) => {
      const filtered = prev.filter((p) => allowed.has(p.themeId));
      if (filtered.length === 0 && availableThemes[0]?.options?.[0]) {
        const t0 = availableThemes[0];
        const o0 = t0.options[0];
        return [
          {
            id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            key: `${t0.id}:${o0.label}:traditional:char`,
            themeId: t0.id,
            option: o0,
            script: 'traditional',
            usePhrase: false,
            fontId: 'trad-A',
            },
        ];
      }
      return filtered;
    });
  }, [availableThemes]);

  useEffect(() => {
    if (bundle === 'single' && picked.length > 1) setPicked((prev) => [prev[0]]);
  }, [bundle, picked]);

  useEffect(() => {
    setArmPickIndex((prev) => {
      const max = Math.max(0, picked.length - 1);
      const clamp = (n: number) => Math.min(Math.max(0, n), max);

      if (bundle === 'single' || picked.length <= 1) return { male: 0, female: 0 };

      let male = clamp(prev.male ?? 0);
      let female = clamp(prev.female ?? 1);

      if (picked.length >= 2 && male === female) female = male === 0 ? 1 : 0;
      return { male, female };
    });
  }, [picked.length, bundle]);

  const handlePlanClick = (pId: string) => {
    setCurrentPlan(pId);
    const qs = new URLSearchParams();
    qs.set('plan', pId);
    if (themeParam) qs.set('theme', themeParam);
    if (isDebugMode) qs.set('debug', '1');
    router.replace(`/customize?${qs.toString()}`, { scroll: false });
  };

  const handleThemeSelect = (theme: Theme) => {
    setActiveTheme(theme);
    const qs = new URLSearchParams();
    qs.set('plan', currentPlan);
    qs.set('theme', theme.id);
    if (isDebugMode) qs.set('debug', '1');
    router.replace(`/customize?${qs.toString()}`, { scroll: false });
  };

  const toggleChar = (theme: Theme, charObj: CharacterOption) => {
    if (isMystery) return;

    const maxChars = canDuo && bundle === 'duo' ? 2 : 1;
    const usePhraseForThisPick = theme.isExclusive ? true : showPhrase;

    const pickScript = isPremium && picked.length > 0 ? picked[picked.length - 1].script : 'traditional';
    const defaultFontId = pickScript === 'simplified' ? 'simp-A' : 'trad-A';

    const key = `${theme.id}:${charObj.label}:${pickScript}:${usePhraseForThisPick ? 'phrase' : 'char'}`;

    setPicked((prev) => {
      // ✅ 防重複選擇：唔理 script，只理 themeId/label/usePhrase
      const existingIdx = prev.findIndex(
        (p) => p.themeId === theme.id && p.option.label === charObj.label && p.usePhrase === usePhraseForThisPick
      );

      if (existingIdx !== -1) return prev.filter((_, idx) => idx !== existingIdx);
      if (prev.length >= maxChars) return prev;

      return [
        ...prev,
        {
          id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          key,
          themeId: theme.id,
          option: charObj,
          script: pickScript,
          usePhrase: usePhraseForThisPick,
          fontId: defaultFontId,
        },
      ];
    });
  };

  const removePick = (id: string) => setPicked((prev) => prev.filter((p) => p.id !== id));

  const setPickFont = (id: string, nextFontId: string) => {
    setPicked((prev) => prev.map((p) => (p.id === id ? { ...p, fontId: nextFontId } : p)));
  };

  const setPickScript = (id: string, nextScript: 'traditional' | 'simplified') => {
    if (!isPremium && nextScript === 'simplified') return;

    setPicked((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const m = p.fontId.match(/-(A|B|C)$/i);
        const letter = (m?.[1] || 'A').toUpperCase();
        const nextFontId = (nextScript === 'traditional' ? 'trad-' : 'simp-') + letter;
        const newKey = `${p.themeId}:${p.option.label}:${nextScript}:${p.usePhrase ? 'phrase' : 'char'}`;

        return { ...p, script: nextScript, fontId: nextFontId, key: newKey };
      })
    );
  };

  const themeById = useMemo(() => {
    const m = new Map<string, Theme>();
    THEMES.forEach((t) => m.set(t.id, t));
    return m;
  }, []);

  const pickToText = (p: PickChoice) => {
    const opt = p.option;
    return p.script === 'traditional'
      ? p.usePhrase
        ? opt.tradPhrase
        : opt.tradChar
      : p.usePhrase
      ? opt.simpPhrase
      : opt.simpChar;
  };

  const pickToFontCss = (p: PickChoice) => {
    const f = FONT_STYLES.find((x) => x.id === p.fontId);
    return f?.css || '"TC-A", serif';
  };

  const pickToFontLabel = (p: PickChoice) => FONT_STYLES.find((x) => x.id === p.fontId)?.label || p.fontId;

  const renderSelectedDesignStyled = () => {
    if (isMystery) return '？';
    if (!picked?.length) return '—';

    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {picked.map((p, idx) => (
          <React.Fragment key={p.id}>
            <span
              style={{
                display: 'inline-block',
                fontFamily: pickToFontCss(p),
                fontWeight: 800,
                fontSize: 28,
                lineHeight: 1,
                color: '#111',
                letterSpacing: '0.02em',
              }}
              title={pickToFontLabel(p)}
            >
              {pickToText(p)}
            </span>

            {idx < picked.length - 1 && (
              <span style={{ fontWeight: 900, fontSize: 18, color: 'rgba(0,0,0,0.45)', lineHeight: 1 }}>+</span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const activeCharsArray = useMemo(() => picked.map(pickToText), [picked]);
  const activeCharsStringForDisplay = activeCharsArray.join(' + ');

  const setByClick = (e: React.MouseEvent<HTMLDivElement>, which: 'male' | 'female') => {
    setActiveArm(which);
    if (!showAdjust) return;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const xPercent = px * 100;
    const yPercent = py * 100;
    const limit = ARM_LIMIT[which];

    const isValid = xPercent >= limit.minX && xPercent <= limit.maxX && yPercent >= limit.minY && yPercent <= limit.maxY;
    if (!isValid) return;

    setPos((v) => ({ ...v, [which]: { ...v[which], x: xPercent, y: yPercent } }));

    if (tipMode === 'howto') {
      setArmClicks((c) => {
        const next = c + 1;
        if (next === ARM_CLICKS_TO_HIDE) scheduleHide(HIDE_AFTER_MS);
        return next;
      });
    }
  };

  const assignPickToArm = (arm: 'male' | 'female', index: number) => {
    setArmPickIndex((prev) => {
      const max = picked.length - 1;
      if (max < 0) return prev;
      const nextIndex = Math.min(Math.max(0, index), max);

      if (bundle === 'duo' && picked.length >= 2) {
        if (arm === 'male' && nextIndex === prev.female) {
          return { male: nextIndex, female: prev.male === nextIndex ? (nextIndex === 0 ? 1 : 0) : prev.male };
        }
        if (arm === 'female' && nextIndex === prev.male) {
          return { male: prev.female === nextIndex ? (nextIndex === 0 ? 1 : 0) : prev.male, female: nextIndex };
        }
      }
      return { ...prev, [arm]: nextIndex };
    });
  };

  const selectionNeeded = isMystery ? 0 : canDuo && bundle === 'duo' ? 2 : 1;
  const selectionValid = isMystery ? true : picked.length === selectionNeeded;
  const canProceed = confirmed && selectionValid && !isRedirecting;

  // ✅ FIX: Build payload with granular metadata (label, lang, style, styleLetter, fontId, type)
  const buildCheckoutPayload = () => {
    const p1 = picked[0];
    const p2 = picked[1];

    const m1 = isMystery ? null : (p1 ? pickToMeta(p1) : null);
    const m2 = isMystery ? null : (p2 ? pickToMeta(p2) : null);

    // Old generic params fallback (optional, useful for debug)
    const qtyParam = isMystery ? 1 : picked.length;
    const layoutParam = `${layoutByArm.male},${layoutByArm.female}`;
    const charParam = isMystery ? 'mystery' : activeCharsStringForDisplay;

    // ✅ FIXED 3: Robust check for Duo validity before sending second set of metadata
    const duoOk = bundle === 'duo' && picked.length >= 2;

    return {
      plan: currentPlan,
      bundle,
      qty: qtyParam,
      
      // ✅ 單買 / DUO 第一份 (Core Metadata)
      theme: isMystery ? 'mystery' : (m1?.theme || ''),
      label: isMystery ? 'mystery' : (m1?.label || ''),
      lang:  isMystery ? 'mystery' : (m1?.lang  || ''),
      style: isMystery ? 'mystery' : (m1?.style || ''),           // SA, SB
      styleLetter: isMystery ? 'mystery' : (m1?.styleLetter || ''), // A, B, C (Backend preferred)
      fontId: isMystery ? 'mystery' : (m1?.fontId || ''),         // raw fontId
      type:  isMystery ? 'mystery' : (m1?.type  || ''),

      // ✅ DUO 第二份 (Only if bundle='duo' AND we have 2 picks)
      theme2: duoOk ? (m2?.theme || '') : '',
      label2: duoOk ? (m2?.label || '') : '',
      lang2:  duoOk ? (m2?.lang  || '') : '',
      style2: duoOk ? (m2?.style || '') : '',
      styleLetter2: duoOk ? (m2?.styleLetter || '') : '',
      fontId2: duoOk ? (m2?.fontId || '') : '',
      type2:  duoOk ? (m2?.type  || '') : '',

      // Legacy/Visual params
      layout: layoutParam,
      char: charParam,
      priceShown: displayPrice,
    };
  };

  const redirectToStripe = async () => {
    if (!confirmed) return;
    if (!selectionValid) return;
    if (isRedirecting) return;

    try {
      setIsRedirecting(true);

      const payload = buildCheckoutPayload();

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        const msg = data?.error || `Checkout error (${res.status})`;
        alert(msg);
        setIsRedirecting(false);
        return;
      }

      if (!data?.url) {
        alert('No Stripe session URL returned.');
        setIsRedirecting(false);
        return;
      }

      window.location.href = data.url as string;
    } catch (err: any) {
      alert(err?.message || 'Failed to start checkout.');
      setIsRedirecting(false);
    }
  };

  const renderTattooTextForArm = (arm: 'male' | 'female') => {
    if (isMystery) return '？';
    if (picked.length === 0) return '—';

    const idx = bundle === 'duo' ? armPickIndex[arm] : 0;
    const p = picked[idx] ?? picked[0];
    const t = themeById.get(p.themeId);
    const str = pickToText(p);
    const fontCss = pickToFontCss(p);
    const armLayout = layoutByArm[arm];

    if (armLayout === 'vertical' && t?.isExclusive && p.usePhrase) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.95, gap: 2 }}>
          {str.split('').map((ch, i) => (
            <span key={`${arm}-${i}`} style={{ fontFamily: fontCss }}>
              {ch}
            </span>
          ))}
        </div>
      );
    }

    if (armLayout === 'vertical') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.95, gap: 2 }}>
          <span style={{ fontFamily: fontCss }}>{str}</span>
        </div>
      );
    }

    return <span style={{ fontFamily: fontCss }}>{str}</span>;
  };

  const progress = Math.min(ARM_CLICKS_TO_HIDE, armClicks);
  const tipText =
    tipMode === 'invite'
      ? 'Tip: Advanced Adjust → move & rotate'
      : progress < ARM_CLICKS_TO_HIDE
      ? `Tip: click arm (${progress + 1}/${ARM_CLICKS_TO_HIDE})`
      : 'Nice—done!';

  const inkColor =
    currentPlan === 'premium'
      ? 'rgba(10,10,10,0.85)'
      : currentPlan === 'standard'
      ? 'rgba(20,20,20,0.75)'
      : 'rgba(30,30,30,0.60)';

  const standardUnit = PACKAGE_DATA.standard.price;
  const standardDuo = PACKAGE_DATA.standard.duoPrice || standardUnit * 2;
  const standardSave = standardUnit * 2 - standardDuo;

  const premiumUnit = PACKAGE_DATA.premium.price;
  const premiumDuo = PACKAGE_DATA.premium.duoPrice || premiumUnit * 2;
  const premiumSave = premiumUnit * 2 - premiumDuo;

  const duoActive = canDuo && bundle === 'duo';

  const confirmText = isMystery
    ? 'I understand this is a curated surprise. The final character will be revealed after payment, and orders cannot be changed.'
    : selectionValid
    ? 'I confirm the character(s), script(s), font style(s), and total shown above are correct.'
    : `Please select ${selectionNeeded} design${selectionNeeded === 1 ? '' : 's'} to continue.`;

  // ✅ FIXED 4: Deduplicate meanings for cleaner display
  const meaningText = Array.from(new Set(picked.map((p) => p.option.meaning))).join(' + ');

  return (
    <div
      className="customizeGrid"
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 40,
        alignItems: 'start',
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <style jsx global>{`
        :root {
          --bg: #fbf6ee;
          --card: #ffffff;
          --ink: #111;
          --muted: rgba(0, 0, 0, 0.62);
          --border: rgba(0, 0, 0, 0.08);
          --gold: #caa34a;
          --gold-antique: #b08d35;
          --gold-deep: #8a6a1c;
          --red: #d9534f;
        }
        @keyframes gentleBounceHorizontal {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }

.rmvBreak { display: none; }
@media (max-width: 640px) {
  .rmvBreak { display: block; line-height: 0; }
}


        /* ✅ FIXED 5: Added missing mobileBreak class with 900px breakpoint */
        .mobileBreak { display: none !important; }
        @media (max-width: 900px) { 
          .mobileBreak { display: block !important; height: 0 !important; }
        }

        /* ✅ FIXED 7: Prevent overlapping tip text on mobile */
        .tipPopup {
          position: absolute;
          top: 2px;
          right: 145px;
        }
        @media (max-width: 640px) {
          .tipPopup {
            position: static !important;
            width: 100%;
            justify-content: flex-end;
            margin-top: 6px;
          }
        }

        @font-face {
          font-family: 'TC-A';
          src: url('/fonts/LXGWWenKai-TC.ttf') format('truetype');
          font-display: swap;
        }
        @font-face {
          font-family: 'TC-B';
          src: url('/fonts/jf-openhuninn-TC.ttf') format('truetype');
          font-display: swap;
        }
        @font-face {
          font-family: 'TC-C';
          src: url('/fonts/NotoSans-TC.ttf') format('truetype');
          font-display: swap;
        }
        @font-face {
          font-family: 'SC-A';
          src: url('/fonts/LXGWWenKai-SC.ttf') format('truetype');
          font-display: swap;
        }
        @font-face {
          font-family: 'SC-B';
          src: url('/fonts/MaShanZheng-SC.ttf') format('truetype');
          font-display: swap;
        }
        @font-face {
          font-family: 'SC-C';
          src: url('/fonts/NotoSans-SC.ttf') format('truetype');
          font-display: swap;
        }

        /* ===== Mobile / Tablet Responsive Fix ===== */
        @media (max-width: 980px) {
          .customizeGrid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }

          .previewCol {
            position: static !important;
            top: auto !important;
          }

          .plansRow {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          .plansRow > button {
            flex: 1 1 calc(50% - 10px) !important;
          }

          .planStandard {
            transform: none !important;
          }
        }

        @media (max-width: 520px) {
          .plansRow > button {
            flex: 1 1 100% !important;
          }

          .previewGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ================= 左欄 ================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Link
            href="/"
            style={{ fontSize: 13, fontWeight: 700, color: '#aaa', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}
          >
            ← Back to Home
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: '"Playfair Display", serif',
                fontSize: 32 * fontScale,
                letterSpacing: '-0.02em',
                color: '#111',
              }}
            >
              Select Package
            </h1>
            {isDebugMode && (
              <button
                onClick={() => setDebugOverlay((v) => !v)}
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  border: '1px solid rgba(0,0,0,0.12)',
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.85)',
                  color: 'rgba(0,0,0,0.55)',
                  cursor: 'pointer',
                }}
              >
                {debugOverlay ? 'Hide Guides' : 'Show Guides'}
              </button>
            )}
          </div>
        </div>

        {isDebugMode && debugOverlay && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#e24a4a',
              background: 'rgba(226,74,74,0.08)',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(226,74,74,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div>
              📍 MALE: x: {pos.male.x.toFixed(1)}% | y: {pos.male.y.toFixed(1)}% | rot: {pos.male.rotate}° | scl:{' '}
              {pos.male.scale.toFixed(2)}
            </div>
            <div>
              📍 FEMALE: x: {pos.female.x.toFixed(1)}% | y: {pos.female.y.toFixed(1)}% | rot: {pos.female.rotate}° | scl:{' '}
              {pos.female.scale.toFixed(2)}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="plansRow" style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <button
            onClick={() => handlePlanClick('basic')}
            style={{
              flex: 1,
              padding: '20px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: currentPlan === 'basic' ? '1.5px solid rgba(108,63,31,0.25)' : '1px solid transparent',
              background: currentPlan === 'basic' ? '#F2E6DA' : 'rgba(255,255,255,0.65)',
              color: currentPlan === 'basic' ? '#6c3f1f' : '#777',
              boxShadow: currentPlan === 'basic' ? '0 10px 24px rgba(108,63,31,0.10)' : 'none',
            }}
          >
            <div style={{ fontSize: 11 * fontScale, fontWeight: 800, letterSpacing: '0.05em' }}>BASIC</div>
            <div style={{ fontSize: 24 * fontScale, fontWeight: 900, margin: '8px 0' }}>${PACKAGE_DATA.basic.price}</div>
            <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.6, marginTop: 4 }}>{PACKAGE_DATA.basic.tagline}</div>
          </button>

          <button
            className="planStandard"
            onClick={() => handlePlanClick('standard')}
            style={{
              flex: 1.3,
              padding: '28px 16px',
              borderRadius: 24,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              border: currentPlan === 'standard' ? '1px solid rgba(176,141,53,0.25)' : '1px solid rgba(0,0,0,0.06)',
              background: currentPlan === 'standard' ? 'linear-gradient(135deg, #F6E7C1, #E8D2A0)' : 'rgba(255,255,255,0.85)',
              color: currentPlan === 'standard' ? '#3b2b10' : '#111',
              transform: currentPlan === 'standard' ? 'scale(1.1)' : 'scale(1)',
              zIndex: currentPlan === 'standard' ? 10 : 1,
              boxShadow: currentPlan === 'standard' ? '0 18px 36px rgba(176,141,53,0.22)' : '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -10,
                background: '#e24a4a',
                color: '#fff',
                fontSize: 10 * fontScale,
                fontWeight: 900,
                padding: '4px 12px',
                borderRadius: 999,
                letterSpacing: '0.05em',
                boxShadow: '0 4px 10px rgba(226,74,74,0.3)',
              }}
            >
              BEST VALUE
            </div>

            {/* ✅ 更強版本：Duo Active 提示 */}
            {currentPlan === 'standard' && duoActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -10,
                  background: '#111',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: 999,
                  letterSpacing: '0.06em',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                }}
              >
                DUO ACTIVE
              </div>
            )}

            <div style={{ fontSize: 12 * fontScale, fontWeight: 900, letterSpacing: '0.05em', opacity: 0.95 }}>STANDARD</div>
            <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.85, marginTop: 2 }}>{PACKAGE_DATA.standard.subtitle}</div>
            <div style={{ fontSize: 42 * fontScale, fontWeight: 900, margin: '4px 0', lineHeight: 1 }}>${standardUnit}</div>

            <div
              style={{
                fontSize: 11 * fontScale,
                fontWeight: 900,
                background: currentPlan === 'standard' ? 'rgba(255,255,255,0.55)' : '#f5f5f7',
                color: currentPlan === 'standard' ? '#3b2b10' : '#333',
                padding: '6px 10px',
                borderRadius: 10,
                marginTop: 4,
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              2 for USD${standardDuo} (Save ${standardSave})
            </div>
          </button>

          <button
            onClick={() => handlePlanClick('premium')}
            style={{
              flex: 1,
              padding: '20px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: currentPlan === 'premium' ? 'rgba(202,163,74,0.18)' : 'rgba(255,255,255,0.65)',
              border: currentPlan === 'premium' ? '2px solid #caa34a' : '1.5px solid rgba(202,163,74,0.35)',
              color: '#8a6a1c',
              boxShadow: currentPlan === 'premium' ? '0 14px 30px rgba(202,163,74,0.16)' : 'none',
              position: 'relative',
            }}
          >
            {/* ✅ 更強版本：Duo Active 提示 */}
            {currentPlan === 'premium' && duoActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -10,
                  background: '#111',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: 999,
                  letterSpacing: '0.06em',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                }}
              >
                DUO ACTIVE
              </div>
            )}

            <div style={{ fontSize: 11 * fontScale, fontWeight: 900, letterSpacing: '0.05em', color: '#8a6a1c' }}>PREMIUM</div>
            <div style={{ fontSize: 24 * fontScale, fontWeight: 900, margin: '8px 0', color: '#111' }}>${premiumUnit}</div>

            <div
              style={{
                background: currentPlan === 'premium' ? 'rgba(255,255,255,0.60)' : '#fff7e7',
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid rgba(202,163,74,0.35)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11 * fontScale, fontWeight: 900, color: '#8a6a1c' }}>2 for USD ${premiumDuo}</div>
              <div style={{ fontSize: 11 * fontScale, marginTop: 4, fontWeight: 900, color: '#8a6a1c', opacity: 0.85 }}>
                (Save ${premiumSave})
              </div>
            </div>

            <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.6, marginTop: 6, color: 'rgba(0,0,0,0.55)' }}>
              {PACKAGE_DATA.premium.tagline}
            </div>
          </button>
        </div>

        {/* Mystery */}
        <button
          onClick={() => handlePlanClick('mystery')}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 18,
            border: currentPlan === 'mystery' ? '2px solid var(--gold)' : '1.5px dashed #ccc',
            background: currentPlan === 'mystery' ? '#fbf6ee' : 'transparent',
            color: '#111',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            transition: '0.2s',
            marginTop: 10,
          }}
        >
          <Image src="/images/mystery.png" alt="Mystery gift" width={26} height={26} style={{ display: 'block', objectFit: 'contain' }} />
          <span style={{ fontSize: 13 * fontScale, fontWeight: 800 }}>Curated Surprise – ${PACKAGE_DATA.mystery.price}</span>
        </button>

        {/* Duo toggle (only standard/premium) */}
        {canDuo && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 20,
              background: '#fcfcfc',
              border: '1px solid #eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              {/* ✅ 更強版本：只係 duo 先 show Save */}
              {bundle === 'duo' ? (
                <div style={{ fontWeight: 900, fontSize: 14 * fontScale, color: '#e24a4a' }}>You save ${saveAmt}</div>
              ) : (
                <div style={{ fontWeight: 900, fontSize: 14 * fontScale, color: '#111' }}>Single design</div>
              )}

              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginTop: 2 }}>
                {bundle === 'duo' ? 'Select 2 designs (mix across themes & scripts)' : 'Select 1 design'}
              </div>
            </div>

            <div style={{ display: 'flex', background: '#eee', borderRadius: 999, padding: 4 }}>
              <button
                onClick={() => setBundle('single')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: 0,
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 12,
                  background: bundle === 'single' ? '#fff' : 'transparent',
                  color: bundle === 'single' ? '#111' : '#888',
                  boxShadow: bundle === 'single' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: '0.2s',
                }}
              >
                Single
              </button>
              <button
                onClick={() => setBundle('duo')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: 0,
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 12,
                  background: bundle === 'duo' ? '#fff' : 'transparent',
                  color: bundle === 'duo' ? '#e24a4a' : '#888',
                  boxShadow: bundle === 'duo' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: '0.2s',
                }}
              >
                Duo ⭐
              </button>
            </div>
          </div>
        )}

        {/* Themes + picks */}
        {!isMystery && (
          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 20,
              border: '1px solid #eee',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                1. Select Theme
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {availableThemes
                  .filter((t) => !t.isExclusive)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeSelect(t)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: activeTheme.id === t.id ? '1px solid var(--gold-antique)' : '1px solid #eee',
                        background: activeTheme.id === t.id ? '#fbf6ee' : '#fafafa',
                        color: activeTheme.id === t.id ? 'var(--gold-deep)' : '#888',
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
              </div>

              {isPremium && (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--gold-deep)',
                      marginTop: 16,
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Premium Exclusive
                    <span style={{ height: 1, background: 'linear-gradient(90deg, var(--gold-antique), transparent)', flex: 1, opacity: 0.3 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {availableThemes
                      .filter((t) => t.isExclusive)
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeSelect(t)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            border: activeTheme.id === t.id ? '1px solid var(--gold-antique)' : '1px solid rgba(202,163,74,0.3)',
                            background: activeTheme.id === t.id ? 'linear-gradient(135deg, var(--gold), var(--gold-antique))' : '#fcfaf5',
                            color: activeTheme.id === t.id ? '#fff' : 'var(--gold-deep)',
                            boxShadow: activeTheme.id === t.id ? '0 4px 12px rgba(202,163,74,0.3)' : 'none',
                          }}
                        >
                          {t.name.split(' ')[0]}
                          <span
                            style={{
                              fontSize: 9,
                              background: activeTheme.id === t.id ? '#fff' : 'var(--gold)',
                              color: activeTheme.id === t.id ? 'var(--gold-deep)' : '#fff',
                              padding: '2px 6px',
                              borderRadius: 6,
                              fontWeight: 900,
                            }}
                          >
                            Exclusive
                          </span>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>

            <hr style={{ border: 0, height: 1, background: '#eee', margin: 0 }} />

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#aaa',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>2. Curated Options</span>
                {!activeTheme.isExclusive ? (
                  <div style={{ display: 'flex', background: '#eee', borderRadius: 999, padding: 2 }}>
                    <button
                      onClick={() => setShowPhrase(false)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 10,
                        borderRadius: 999,
                        border: 0,
                        background: !showPhrase ? '#fff' : 'transparent',
                        color: !showPhrase ? '#111' : '#888',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Single
                    </button>
                    <button
                      onClick={() => setShowPhrase(true)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 10,
                        borderRadius: 999,
                        border: 0,
                        background: showPhrase ? '#fff' : 'transparent',
                        color: showPhrase ? '#111' : '#888',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Phrase
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', background: 'rgba(202,163,74,0.1)', padding: '4px 8px', borderRadius: 6 }}>
                    Double-Character Only
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12 }}>
                {activeTheme.options.map((opt) => {
                  const effectiveUsePhrase = activeTheme.isExclusive ? true : showPhrase;
                  const matchedPick = picked.find((p) => p.themeId === activeTheme.id && p.option.label === opt.label && p.usePhrase === effectiveUsePhrase);
                  const isSelected = !!matchedPick;
                  const displayScript = matchedPick ? matchedPick.script : 'traditional';
                  const pickedFontCss = matchedPick ? pickToFontCss(matchedPick) : '"TC-A", serif';
                  const displayStr =
                    displayScript === 'traditional'
                      ? effectiveUsePhrase
                        ? opt.tradPhrase
                        : opt.tradChar
                      : effectiveUsePhrase
                      ? opt.simpPhrase
                      : opt.simpChar;
                  const isSame = (effectiveUsePhrase ? opt.tradPhrase : opt.tradChar) === (effectiveUsePhrase ? opt.simpPhrase : opt.simpChar);

                  return (
                    <button
                      key={`${activeTheme.id}-${opt.label}-${effectiveUsePhrase ? 'p' : 'c'}`}
                      onClick={() => toggleChar(activeTheme, opt)}
                      style={{
                        padding: '16px 8px',
                        borderRadius: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        position: 'relative',
                        border: isSelected ? '2px solid var(--gold)' : '1px solid #eaeaea',
                        background: isSelected ? '#fffdfa' : '#fff',
                        boxShadow: isSelected ? '0 4px 12px rgba(202,163,74,0.15)' : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      {displayScript === 'simplified' && isSame && (
                        <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 8, background: '#eee', color: '#888', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          Same
                        </div>
                      )}
                      <div style={{ fontSize: effectiveUsePhrase ? 26 : 32, fontFamily: pickedFontCss, color: '#111', lineHeight: 1 }}>{displayStr}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: isSelected ? 'var(--gold-deep)' : '#888', textAlign: 'center' }}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginTop: 16, background: '#fafafa', padding: '10px 14px', borderRadius: 12, border: '1px solid #eee' }}>
                <strong style={{ color: 'var(--gold-deep)' }}>Meaning:</strong> {meaningText}
              </div>

              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 12, border: '1px solid #eee', background: '#fff' }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', color: '#aaa' }}>YOUR PICKS</div>

                {picked.length === 0 ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>No selection yet.</div>
                ) : (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {picked.map((p, idx) => {
                      const text = pickToText(p);
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            padding: '8px 12px',
                            borderRadius: 12,
                            border: '1px solid rgba(202,163,74,0.35)',
                            background: '#fff7e7',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 900, color: '#111', fontSize: 15, fontFamily: pickToFontCss(p) }}>{text}</span>
                              {bundle === 'duo' && picked.length >= 2 && (
                                <span style={{ display: 'inline-flex', gap: 6, marginLeft: 4 }}>
                                  <button
                                    type="button"
                                    onClick={() => assignPickToArm('male', idx)}
                                    style={{
                                      border: armPickIndex.male === idx ? '1px solid rgba(0,0,0,0.28)' : '1px solid rgba(0,0,0,0.12)',
                                      background: armPickIndex.male === idx ? '#111' : '#fff',
                                      color: armPickIndex.male === idx ? '#fff' : '#666',
                                      borderRadius: 999,
                                      padding: '2px 6px',
                                      cursor: 'pointer',
                                      fontWeight: 900,
                                      fontSize: 10,
                                      lineHeight: 1,
                                    }}
                                    aria-label="Assign to Left"
                                    title="Assign to Left Arm"
                                  >
                                    L
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => assignPickToArm('female', idx)}
                                    style={{
                                      border: armPickIndex.female === idx ? '1px solid rgba(0,0,0,0.28)' : '1px solid rgba(0,0,0,0.12)',
                                      background: armPickIndex.female === idx ? '#111' : '#fff',
                                      color: armPickIndex.female === idx ? '#fff' : '#666',
                                      borderRadius: 999,
                                      padding: '2px 6px',
                                      cursor: 'pointer',
                                      fontWeight: 900,
                                      fontSize: 10,
                                      lineHeight: 1,
                                    }}
                                    aria-label="Assign to Right"
                                    title="Assign to Right Arm"
                                  >
                                    R
                                  </button>
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removePick(p.id)}
                              style={{
                                border: '1px solid rgba(0,0,0,0.15)',
                                background: '#fff',
                                borderRadius: 999,
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontWeight: 900,
                                fontSize: 11,
                                lineHeight: 1,
                              }}
                              aria-label="Remove"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ display: 'inline-flex', gap: 4 }}>
                              <button
                                type="button"
                                title="Traditional Chinese"
                                onClick={() => setPickScript(p.id, 'traditional')}
                                style={{
                                  border: '1px solid rgba(0,0,0,0.12)',
                                  background: p.script === 'traditional' ? '#111' : '#fff',
                                  color: p.script === 'traditional' ? '#fff' : '#666',
                                  borderRadius: 999,
                                  padding: '4px 8px',
                                  fontWeight: 900,
                                  fontSize: 10,
                                  cursor: 'pointer',
                                }}
                              >
                                TC
                              </button>
                              <button
                                type="button"
                                title="Simplified Chinese"
                                disabled={!isPremium}
                                onClick={() => setPickScript(p.id, 'simplified')}
                                style={{
                                  border: '1px solid rgba(0,0,0,0.12)',
                                  background: p.script === 'simplified' ? '#111' : '#fff',
                                  color: p.script === 'simplified' ? '#fff' : isPremium ? '#666' : '#ccc',
                                  borderRadius: 999,
                                  padding: '4px 8px',
                                  fontWeight: 900,
                                  fontSize: 10,
                                  cursor: isPremium ? 'pointer' : 'not-allowed',
                                }}
                              >
                                SC {!isPremium && '🔒'}
                              </button>
                            </span>

                            <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.1)' }} />

                            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                              {['A', 'B', 'C'].map((letter) => {
                                const nextFontId = (p.script === 'traditional' ? 'trad-' : 'simp-') + letter;
                                const active = p.fontId === nextFontId;
                                return (
                                  <button
                                    key={`${p.id}-${letter}`}
                                    type="button"
                                    onClick={() => setPickFont(p.id, nextFontId)}
                                    style={{
                                      border: active ? '1px solid rgba(0,0,0,0.28)' : '1px solid rgba(0,0,0,0.12)',
                                      background: active ? '#111' : '#fff',
                                      color: active ? '#fff' : '#666',
                                      borderRadius: 999,
                                      padding: '4px 8px',
                                      fontWeight: 900,
                                      fontSize: 10,
                                      lineHeight: 1,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Style {letter}
                                  </button>
                                );
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <span style={{ fontSize: 11, color: '#888', fontWeight: 800, textAlign: 'right' }}>
                      ({picked.length}/{selectionNeeded || 1}) selected
                    </span>

                    {bundle === 'duo' && picked.length >= 2 && (
                      <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(0,0,0,0.55)', fontWeight: 700 }}>
                        Tip: Use <b>L</b> / <b>R</b> buttons to place each design on the correct arm for the Live Preview.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 右欄 ================= */}
      <div className="previewCol" style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="previewHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Live Preview</span>
              </div>
              <button
                onClick={() => {
                  setShowAdjust((v) => {
                    const next = !v;
                    if (next) {
                      setTipMode('howto');
                      setArmClicks(0);
                      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
                      hideTimerRef.current = null;
                    } else {
                      setTipMode('invite');
                    }
                    return next;
                  });
                }}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {showAdjust ? '✓ Done Adjust' : '⚙️ Advanced Adjust'}
              </button>

              {tipMode !== 'hidden' && (
                <div
                  className="tipPopup"
                  style={{
                    opacity: (tipMode === 'invite' && !showAdjust) || (tipMode === 'howto' && showAdjust) ? 1 : 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.8s ease',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    animation: 'gentleBounceHorizontal 2s infinite ease-in-out',
                    zIndex: 20,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8a8a8a', whiteSpace: 'nowrap' }}>{tipText}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div
            className="previewGrid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              borderRadius: 24,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.05)',
              position: 'relative',
            }}
          >
            {/* 置中的 AI Mockup 提示標籤 */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '8px 16px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: 12,
                fontWeight: 900,
                color: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                zIndex: 10,
                pointerEvents: 'none',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              <span>AI Mockup • </span>
<br className="rmvBreak" />
<span>Results may vary</span>
            </div>

            {/* Male */}
            <div onClick={(e) => setByClick(e, 'male')} style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', cursor: showAdjust ? 'crosshair' : 'pointer' }}>
              <Image
                src="/images/demo1.png"
                alt="Male"
                fill
                sizes="(max-width: 520px) 100vw, (max-width: 980px) 100vw, 50vw"
                style={{ objectFit: 'cover', objectPosition: 'left center', pointerEvents: 'none' }}
                priority
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${pos.male.x}%`,
                  top: `${pos.male.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.male.rotate}deg) scale(${pos.male.scale})`,
                  fontSize: 'clamp(26px, 6vw, 46px)',
                  fontWeight: 900,
                  color: inkColor,
                  mixBlendMode: 'multiply',
                  opacity: isMystery ? 0.3 : 0.85,
                  filter: isMystery ? 'blur(2px)' : 'blur(0.3px)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease-out',
                  whiteSpace: layoutByArm.male === 'horizontal' ? 'nowrap' : 'normal',
                  display: 'inline-block',
                }}
              >
                {renderTattooTextForArm('male')}
              </div>
              {showAdjust && activeArm === 'male' && <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(202,163,74,0.6)', pointerEvents: 'none' }} />}
            </div>

            {/* Female */}
            <div onClick={(e) => setByClick(e, 'female')} style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', cursor: showAdjust ? 'crosshair' : 'pointer' }}>
              <Image
                src="/images/demo2.png"
                alt="Female"
                fill
                sizes="(max-width: 520px) 100vw, (max-width: 980px) 100vw, 50vw"
                style={{ objectFit: 'cover', objectPosition: 'right center', pointerEvents: 'none' }}
                priority
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${pos.female.x}%`,
                  top: `${pos.female.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.female.rotate}deg) scale(${pos.female.scale})`,
                  fontSize: 'clamp(26px, 6vw, 46px)',
                  fontWeight: 900,
                  color: inkColor,
                  mixBlendMode: 'multiply',
                  opacity: isMystery ? 0.3 : 0.85,
                  filter: isMystery ? 'blur(2px)' : 'blur(0.3px)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease-out',
                  whiteSpace: layoutByArm.female === 'horizontal' ? 'nowrap' : 'normal',
                  display: 'inline-block',
                }}
              >
                {renderTattooTextForArm('female')}
              </div>
              {showAdjust && activeArm === 'female' && <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(202,163,74,0.6)', pointerEvents: 'none' }} />}
            </div>
          </div>

          {/* Adjust Panel */}
          {showAdjust && (
            <div style={{ padding: 16, background: '#fff', borderRadius: 16, border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setActiveArm('male')}
                  style={{ flex: 1, padding: '8px', fontSize: 11, fontWeight: 800, border: 0, borderRadius: 8, background: activeArm === 'male' ? '#111' : '#f5f5f7', color: activeArm === 'male' ? '#fff' : '#888', cursor: 'pointer' }}
                >
                  Left Arm (Male)
                </button>
                <button
                  onClick={() => setActiveArm('female')}
                  style={{ flex: 1, padding: '8px', fontSize: 11, fontWeight: 800, border: 0, borderRadius: 8, background: activeArm === 'female' ? '#111' : '#f5f5f7', color: activeArm === 'female' ? '#fff' : '#888', cursor: 'pointer' }}
                >
                  Right Arm (Female)
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, width: 40, color: '#555' }}>Size</span>
                <input
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.05"
                  value={pos[activeArm].scale}
                  onChange={(e) => setPos((v) => ({ ...v, [activeArm]: { ...v[activeArm], scale: Number(e.target.value) } }))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 11, width: 30, textAlign: 'right', color: '#888' }}>{Math.round(pos[activeArm].scale * 100)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, width: 40, color: '#555' }}>Angle</span>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={pos[activeArm].rotate}
                  onChange={(e) => setPos((v) => ({ ...v, [activeArm]: { ...v[activeArm], rotate: Number(e.target.value) } }))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 11, width: 30, textAlign: 'right', color: '#888' }}>{pos[activeArm].rotate}°</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, width: 40, color: '#555' }}>Layout</span>
                <div style={{ flex: 1, display: 'flex', background: '#f5f5f7', borderRadius: 999, padding: 3 }}>
                  <button
                    type="button"
                    onClick={() => setLayoutByArm((v) => ({ ...v, [activeArm]: 'horizontal' }))}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 999, border: 0, cursor: 'pointer', fontWeight: 900, fontSize: 11, background: layoutByArm[activeArm] === 'horizontal' ? '#111' : 'transparent', color: layoutByArm[activeArm] === 'horizontal' ? '#fff' : '#777' }}
                  >
                    Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutByArm((v) => ({ ...v, [activeArm]: 'vertical' }))}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 999, border: 0, cursor: 'pointer', fontWeight: 900, fontSize: 11, background: layoutByArm[activeArm] === 'vertical' ? '#111' : 'transparent', color: layoutByArm[activeArm] === 'vertical' ? '#fff' : '#777' }}
                  >
                    Vertical
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #eee', paddingTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, width: 40, color: '#555' }}>UI Size</span>
                <input type="range" min="0.85" max="1.25" step="0.05" value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} style={{ flex: 1, cursor: 'pointer' }} />
                <span style={{ fontSize: 11, width: 30, textAlign: 'right', color: '#888' }}>{Math.round(fontScale * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= 最終付款確認區 ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: 16, background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>Selected Design:</span>
              <div style={{ textAlign: 'right' }}>{renderSelectedDesignStyled()}</div>
            </div>

            {!isMystery && picked.length > 0 && (
              <div style={{ marginTop: 2, fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,0.45)', textAlign: 'right', lineHeight: 1.4 }}>
                {picked.map((p, i) => (
                  <span key={p.id}>
                    {pickToText(p)} • {pickToFontLabel(p)}
                    {p.script === 'traditional' ? ' (TC)' : ' (SC)'}
                    {i < picked.length - 1 ? ' | ' : ''}
                  </span>
                ))}
              </div>
            )}

            <hr style={{ border: 0, height: 1, background: '#eee', margin: '6px 0 2px' }} />

            {/* Files included boxes */}
            {!isMystery && bundle === 'duo' && (
              <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 12, border: '1px solid #eee', background: '#fbf6ee' }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', color: '#888' }}>FILES INCLUDED</div>
                {picked.length < 2 ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#777', fontWeight: 700 }}>
                    Select <span style={{ color: '#111' }}>2</span> designs to receive <span style={{ color: '#111' }}>2 separate files</span>.
                  </div>
                ) : (
                  <>
                    <div style={{ marginTop: 6, fontSize: 12, color: '#111', fontWeight: 900 }}>
                      You will receive <span style={{ color: 'var(--gold-deep)' }}>2 separate stencil files</span>:
                    </div>
                    <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18, color: '#111', fontSize: 12, fontWeight: 800, lineHeight: 1.6 }}>
                      <li>
                        File 1: {activeCharsArray[0]}
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.55)' }}>• {picked[0] ? pickToFontLabel(picked[0]) : ''}</span>
                      </li>
                      <li>
                        File 2: {activeCharsArray[1]}
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.55)' }}>• {picked[1] ? pickToFontLabel(picked[1]) : ''}</span>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            )}

            {!isMystery && bundle === 'single' && picked.length === 1 && (
              <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 12, border: '1px solid #eee', background: '#fbf6ee' }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', color: '#888' }}>FILE INCLUDED</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#111', fontWeight: 900 }}>
                  <span style={{ color: 'var(--gold-deep)' }}>1 stencil file</span>:
                </div>
                <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18, color: '#111', fontSize: 12, fontWeight: 800, lineHeight: 1.6 }}>
                  <li>
                    {activeCharsArray[0]}
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 900, color: 'rgba(0,0,0,0.55)' }}>• {picked[0] ? pickToFontLabel(picked[0]) : ''}</span>
                  </li>
                </ul>
              </div>
            )}

            {isMystery && (
              <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 12, border: '1px solid #eee', background: '#fbf6ee' }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', color: '#888' }}>MYSTERY DELIVERY</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#111', fontWeight: 800, lineHeight: 1.5 }}>
                  You will receive <span style={{ color: 'var(--gold-deep)', fontWeight: 900 }}>1 curated design</span> revealed after payment.
                </div>
              </div>
            )}

            <hr style={{ border: 0, height: 1, background: '#eee', margin: '2px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Total:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#caa34a' }}>USD${displayPrice}</span>
              </div>

              <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', marginTop: 4, textAlign: 'right' }}>
                Final price shown in USD.
              </div>

              {/* ✅ 更強版本：duo 先 show saving line（提升成交） */}
              {canDuo && bundle === 'duo' && saveAmt > 0 && (
                <div style={{ fontSize: 10, color: '#e24a4a', fontWeight: 900, marginTop: 4, textAlign: 'right' }}>
                  You saved ${saveAmt} with Duo.
                </div>
              )}

              <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', marginTop: 6, textAlign: 'right' }}>
                Secure encrypted checkout (Stripe). Payment details are entered on the next page.
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: selectionValid ? 'pointer' : 'not-allowed', padding: '0 4px', opacity: selectionValid ? 1 : 0.7 }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, cursor: selectionValid ? 'pointer' : 'not-allowed', accentColor: '#caa34a' }}
              disabled={!selectionValid || isRedirecting}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.7)', lineHeight: 1.4 }}>
              {confirmText}
            </span>
          </label>

          {/* ✅ FIXED 6: Button Text - Method 1 */}
          <button
            disabled={!canProceed}
            onClick={redirectToStripe}
            style={{
              width: '100%',
              padding: 22,
              borderRadius: 20,
              background: 'linear-gradient(180deg, #caa34a, #b08d35)',
              color: '#fff',
              fontWeight: 950,
              fontSize: 19,
              letterSpacing: '0.3px',
              border: 0,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              boxShadow: canProceed ? '0 10px 25px rgba(176,141,53,0.4)' : 'none',
              opacity: canProceed ? 1 : 0.6,
              transition: 'all 0.2s',
            }}
          >
            {isRedirecting ? 'Redirecting to Stripe…' : `Pay USD$${displayPrice} securely →`}
          </button>

          <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(0,0,0,0.55)', textAlign: 'center', maxWidth: 520, margin: '14px auto 0' }}>
            <div>No subscription. One-time purchase.</div>
            <div>Instant download after successful payment.</div>
            <div style={{ color: '#e24a4a', fontWeight: 800 }}>
              Please enter a valid email at checkout
              <br className="mobileBreak" />
              (delivery is email-based).
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, color: 'rgba(0,0,0,0.65)' }}>
              Digital sales are final.
              <br className="mobileBreak" />
              Orders cannot be changed after checkout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: '#fbf6ee', padding: '15px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', paddingTop: 100, fontWeight: 600, color: '#888' }}>Loading Studio...</div>}>
          <CustomizeContent />
        </Suspense>
      </div>
    </div>
  );
}


