import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit } from "next/font/google";

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
  title: site.name,
  description: site.description,
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
      <body
        className={`${display.className} flex min-h-full flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
