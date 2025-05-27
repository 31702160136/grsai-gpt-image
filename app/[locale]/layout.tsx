import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./layout.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Metadata } from "next";
import config from "@/config";
import { Analytics } from "@vercel/analytics/react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: config.Title,
  description: config.Description,
  icons: "/favicon.ico",
  openGraph: {
    title: config.Title,
    description: config.Description,
    url: config.WebUrl,
    siteName: config.Title,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: config.Title,
    description: config.Description,
  },
  keywords: ["gpt4o image", "4o image", "4o", "gpt4o"],
  robots: "index, follow",
  alternates: {
    canonical: config.WebUrl,
    languages: {
      en: `${config.WebUrl}/en`,
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="alternate" hrefLang="en" href="/" data-cmp-info="10"></link>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br">
            <div className=" bg h-[600px] absolute top-0 left-0 w-full z-0"></div>
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
