import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://tattooclarity.com"),

  title: {
    default: "Tattoo Clarity Studio | Studio-Ready Chinese Character Stencils",
    template: "%s | Tattoo Clarity Studio",
  },

  description:
    "Preview Chinese character tattoos properly before you ink. Curated, culturally reviewed, and studio-ready stencil files. Traditional & Simplified options available.",

  keywords: [
    "Chinese tattoo stencil",
    "Chinese character tattoo",
    "Chinese calligraphy tattoo",
    "tattoo stencil download",
    "tattoo-ready Chinese",
    "traditional Chinese tattoo",
    "simplified Chinese tattoo",
    "Chinese character generator",
  ],

  alternates: {
    canonical: "/", // ✅ OK：homepage canonical
  },

  openGraph: {
    title: "Tattoo Clarity Studio",
    description:
      "Studio-Ready Chinese Character Stencils. Curated. Balanced. Permanent.",
    url: "https://tattooclarity.com",
    siteName: "Tattoo Clarity Studio",
    images: [
      {
        url: "/og-image.jpg", // ✅ 用相對路徑更穩（metadataBase 會幫你補全）
        width: 1200,
        height: 630,
        alt: "Tattoo Clarity Studio - Chinese Character Tattoo Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Tattoo Clarity Studio",
    description:
      "Studio-Ready Chinese Character Stencils. Curated. Balanced. Permanent.",
    images: ["/og-image.jpg"],
  },

  // ✅ 非常重要：Google 會睇 robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // ✅ 品牌/分類資訊（細節，但加咗更完整）
  applicationName: "Tattoo Clarity Studio",
  category: "Design",
  creator: "Tattoo Clarity Studio",
  publisher: "Tattoo Clarity Studio",

  // ✅ favicon / app icons（你要確保 public 有呢啲檔）
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  // ✅ PWA（可選，但加咗唔會壞）
  manifest: "/site.webmanifest",

  // ✅ 之後你 Search Console / Bing 用（冇就先留空）
  // verification: {
  //   google: "你的Google驗證碼",
  //   other: { "msvalidate.01": "你的Bing驗證碼" },
  // },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}