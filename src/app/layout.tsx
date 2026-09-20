import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit } from "next/font/google";

import { JsonLd } from "@/components/seo/JsonLd";
import { site } from "@/content/site";

import "./globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Nagykanizsa | Teniszpálya Foglalás`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${site.name} — Nagykanizsa | 8 Salakos Teniszpálya`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "hu_HU",
    type: "website",
    images: [
      {
        url: "/images/landing/landing-hero.jpg",
        width: 1200,
        height: 630,
        alt: `${site.name} — Nagykanizsa teniszpályák`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Nagykanizsa`,
    description: site.description,
    images: ["/images/landing/landing-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f4f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={site.lang}
      className={`${display.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd />
      </head>
      <body
        className={`${display.className} flex min-h-full flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

