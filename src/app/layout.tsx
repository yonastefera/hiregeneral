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

export const metadata: Metadata = {
  title: "HireGeneral",
  description: "A job board for candidates and employers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

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

        <Analytics />

        {clarityProjectId && <MicrosoftClarity projectId={clarityProjectId} />}

        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
