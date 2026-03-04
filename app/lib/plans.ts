export type PlanId = 'mystery' | 'basic' | 'premium';

export const PLANS: Record<PlanId, { name: string; price: number; subtitle: string }> = {
  mystery: { name: 'Mystery', price: 39, subtitle: 'Random curated pick + surprise vibe' },
  basic: { name: 'Basic', price: 59, subtitle: 'Most popular starter' },
  premium: { name: 'Premium', price: 99, subtitle: 'Best gift-ready option' },
};

export function isPlanId(x: string | null): x is PlanId {
  return x === 'mystery' || x === 'basic' || x === 'premium';
}