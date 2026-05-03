import Link from "next/link";
import {
  BriefcaseBusiness,
  FileText,
  MapPin,
  Shield,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const skills = [
  "React",
  "TypeScript",
  "SQL",
  "Product thinking",
  "Remote collaboration",
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-primary"
          >
            HireGeneral
          </Link>
          <Button variant="hero" asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-border bg-surface p-6 shadow-soft">
          <div className="flex size-20 items-center justify-center rounded-lg bg-secondary text-2xl font-bold text-secondary-foreground">
            AM
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Avery Morgan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Senior product engineer seeking remote-first teams.
          </p>
          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="size-4" />
              New York, NY
            </p>
            <p className="flex items-center gap-2">
              <BriefcaseBusiness className="size-4" />
              Open to full-time
            </p>
            <p className="flex items-center gap-2">
              <Shield className="size-4" />
              Profile visibility: Private
            </p>
          </div>
          <Button variant="glass" className="mt-6 w-full">
            Make profile public
          </Button>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">
                Contact information
              </h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Email address"
                defaultValue="avery@example.com"
              />
              <Input placeholder="Phone number" defaultValue="(555) 012-4890" />
              <Input placeholder="Location" defaultValue="New York, NY" />
              <Input placeholder="Portfolio" defaultValue="averymorgan.dev" />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight">
                  Resume and skills
                </h2>
              </div>
              <Button variant="warm">Upload resume</Button>
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
              Avery_Morgan_Resume.pdf · Updated 2 days ago
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <h2 className="text-xl font-bold tracking-tight">
              Additional information
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input placeholder="Gender" />
              <Input placeholder="Ethnicity" />
              <Input placeholder="Veteran status" />
              <Input placeholder="Disability status" />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              These fields are optional and can remain private. They help
              employers support inclusive hiring reporting where applicable.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
