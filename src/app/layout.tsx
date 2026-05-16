import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SiteHeaderController } from "@/components/SiteHeaderController";
import { AppProviders } from "@/components/providers/AppProviders";
import ConsoleBrand from "@/components/ConsoleBrand";
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
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="flex min-h-screen flex-col bg-background">
            <SiteHeaderController />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AppProviders>

        <ConsoleBrand />
      </body>
    </html>
  );
}
