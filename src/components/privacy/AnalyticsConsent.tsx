"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

import MicrosoftClarity from "@/components/MicrosoftClarity";

const CONSENT_COOKIE = "hg_analytics_consent";
type Consent = "accepted" | "declined" | null;

function readConsent(): Consent {
  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  return value === "accepted" || value === "declined" ? value : null;
}

function saveConsent(value: Exclude<Consent, null>) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${secure}`;
}

export default function AnalyticsConsent({
  enabled,
  gaId,
  clarityProjectId,
}: {
  enabled: boolean;
  gaId?: string;
  clarityProjectId?: string;
}) {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
  }, []);

  if (!enabled || !ready) return null;

  const choose = (value: Exclude<Consent, null>) => {
    saveConsent(value);
    setConsent(value);
    setPreferencesOpen(false);

    if (value === "declined") window.location.reload();
  };

  return (
    <>
      {consent === "accepted" ? (
        <>
          <Analytics />
          {clarityProjectId ? (
            <MicrosoftClarity projectId={clarityProjectId} />
          ) : null}
          {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        </>
      ) : null}

      {consent === null || preferencesOpen ? (
        <section
          aria-label="Analytics preferences"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-lift"
        >
          <h2 className="font-semibold">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            HireGeneral uses essential technologies to operate securely. With
            your permission, we also use Vercel Analytics, Google Analytics, and
            Microsoft Clarity to understand and improve the site.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
              onClick={() => choose("accepted")}
              type="button"
            >
              Accept analytics
            </button>
            <button
              className="rounded-full border border-border px-5 py-2 text-sm font-medium"
              onClick={() => choose("declined")}
              type="button"
            >
              Essential only
            </button>
          </div>
        </section>
      ) : (
        <button
          className="fixed bottom-3 left-3 z-[90] rounded-full border border-border bg-background px-3 py-2 text-xs font-medium shadow-soft"
          onClick={() => setPreferencesOpen(true)}
          type="button"
        >
          Privacy choices
        </button>
      )}
    </>
  );
}
