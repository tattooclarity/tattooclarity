import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  metadataBase: new URL('https://tattooclarity.com'),
  title: 'Chinese Character Tattoo Generator | Tattoo Clarity Studio',
  description:
    'Preview Chinese character tattoos properly before you ink. Curated, culturally reviewed, and 300 DPI studio-ready stencil files. Traditional & Simplified options available.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Chinese Character Tattoo Generator | Tattoo Clarity Studio',
    description:
      'Studio-Ready Chinese Character Stencils. Curated. Balanced. Permanent.',
    url: 'https://tattooclarity.com',
    siteName: 'Tattoo Clarity Studio',
    images: [
      { url: '/og-image.jpg', width: 1200, height: 630 },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chinese Character Tattoo Generator | Tattoo Clarity Studio',
    description:
      'Studio-Ready Chinese Character Stencils. Curated. Balanced. Permanent.',
    images: ['/og-image.jpg'],
  },
};

export default function Page() {
  return <HomeClient />;
}