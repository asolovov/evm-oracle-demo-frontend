import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { CrtBackground } from "@/components/layout/crt-background";
import { CrtOverlays } from "@/components/layout/crt-overlays";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import { AUTHOR } from "@/config/author";
import { env } from "@/env";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const TITLE = "Lighthouse Oracle — Multi-source price oracle by Andrei Solovov";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: TITLE,
  description: AUTHOR.bio,
  authors: [{ name: AUTHOR.name, url: AUTHOR.links.github }],
  openGraph: {
    type: "website",
    url: env.NEXT_PUBLIC_SITE_URL,
    title: "Lighthouse Oracle",
    description: AUTHOR.bio,
    siteName: "Lighthouse Oracle",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lighthouse Oracle",
    description: AUTHOR.bio,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffb000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body style={{ minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
        <CrtBackground />
        <WalletProvider>
          <div
            style={{
              position: "relative",
              zIndex: 5,
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <DemoBanner />
            <SiteHeader />
            <main
              style={{
                flex: 1,
                width: "100%",
                maxWidth: 1240,
                margin: "0 auto",
                padding: "clamp(22px,4vw,46px) clamp(14px,4vw,40px) 70px",
              }}
            >
              {children}
            </main>
            <SiteFooter />
          </div>
        </WalletProvider>
        <CrtOverlays />
      </body>
    </html>
  );
}
