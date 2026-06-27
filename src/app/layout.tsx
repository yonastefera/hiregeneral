import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";

import MicrosoftClarity from "@/components/MicrosoftClarity";
import WebVitals from "@/components/WebVitals";

import ConsoleBrand from "@/components/ConsoleBrand";
import { Footer } from "@/components/Footer";

import { AppProviders } from "@/components/providers/AppProviders";
import { SiteHeaderController } from "@/components/SiteHeaderController";

import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hiregeneral.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "HireGeneral | Search Smarter. Hire Faster.",
    template: "%s | HireGeneral",
  },

  description:
    "Find better-fit roles, compare salary intelligence, and connect with employers through HireGeneral.",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    url: "/",
    siteName: "HireGeneral",
    title: "HireGeneral | Search Smarter. Hire Faster.",
    description:
      "Find better-fit roles, compare salary intelligence, and connect with employers through HireGeneral.",
  },

  twitter: {
    card: "summary_large_image",
    title: "HireGeneral | Search Smarter. Hire Faster.",
    description:
      "Find better-fit roles, compare salary intelligence, and connect with employers through HireGeneral.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  const enableAnalytics =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";

  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="flex min-h-screen flex-col bg-background">
            <SiteHeaderController />

            <main className="flex-1">{children}</main>

            <Footer />
          </div>
        </AppProviders>

        <ConsoleBrand />

        <WebVitals />

        {enableAnalytics && <Analytics />}

        {enableAnalytics && clarityProjectId ? (
          <MicrosoftClarity projectId={clarityProjectId} />
        ) : null}

        {enableAnalytics && gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
