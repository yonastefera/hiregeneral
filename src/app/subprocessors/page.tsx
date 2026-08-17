import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Subprocessors | HireGeneral",
  description: "Service providers that help HireGeneral operate its platform.",
};

const providers = [
  {
    name: "Supabase",
    purpose:
      "Database, authentication, file storage, and platform infrastructure",
    location: "United States",
  },
  {
    name: "Vercel",
    purpose: "Application hosting, content delivery, and operational logs",
    location: "United States and global infrastructure",
  },
  {
    name: "Resend",
    purpose: "Transactional email delivery",
    location: "United States",
  },
  {
    name: "Stripe",
    purpose:
      "Payment processing and subscription management when billing is used",
    location: "United States and global infrastructure",
  },
  {
    name: "Google",
    purpose:
      "Optional Google account authentication and consent-gated analytics",
    location: "United States and global infrastructure",
  },
  {
    name: "Microsoft",
    purpose: "Consent-gated Clarity site analytics",
    location: "United States and global infrastructure",
  },
] as const;

export default function SubprocessorsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-foreground">
      <article className="mx-auto max-w-4xl">
        <Link className="text-sm font-medium text-teal-700" href="/privacy">
          ← Privacy Policy
        </Link>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          HireGeneral privacy
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">
          Subprocessors
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          HireGeneral LLC uses the providers below to process information needed
          to operate HireGeneral. This list was last updated August 16, 2026.
        </p>

        <div className="mt-10 overflow-hidden rounded-3xl border border-border">
          {providers.map((provider) => (
            <section
              className="grid gap-2 border-b border-border p-6 last:border-b-0 md:grid-cols-[0.7fr_1.5fr_1fr]"
              key={provider.name}
            >
              <h2 className="font-semibold">{provider.name}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {provider.purpose}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {provider.location}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm leading-6 text-muted-foreground">
          We may update this list as our services change. Questions about a
          provider or data transfer can be sent to privacy@hiregeneral.com.
        </p>
      </article>
    </main>
  );
}
