import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";

import { site } from "@/content/site";

import "./globals.css";

/** Savee Font substitute from DESIGN.md — geometric sans, 400/500. */
const saveeSans = DM_Sans({
  variable: "--font-savee",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={site.lang}
      className={`${saveeSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={`${saveeSans.className} flex min-h-full flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
