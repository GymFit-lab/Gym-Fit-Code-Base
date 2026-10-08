import type { Metadata, Viewport } from "next";
import { Bebas_Neue, JetBrains_Mono, Manrope } from "next/font/google";

import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { RevealObserver } from "@/components/reveal-observer";
import { ThemeProvider } from "@/components/theme-provider";
import { commonContent } from "@/content/landing";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: siteConfig.colors.iron },
    { media: "(prefers-color-scheme: light)", color: siteConfig.colors.chalk },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bebas.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-full bg-primary px-5 py-3 font-semibold text-iron focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
          >
            {commonContent.skipLink}
          </a>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
          <RevealObserver />
        </ThemeProvider>
      </body>
    </html>
  );
}
