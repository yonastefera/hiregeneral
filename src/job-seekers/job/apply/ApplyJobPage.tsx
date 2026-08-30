import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ApplyJobClient from "./ApplyJobClient";
import { buildApplicationDefaults } from "./application-defaults";
import { getApplyJobData } from "./apply-data";
import { getJobTitle } from "./apply-utils";
import { createClient } from "@/lib/supabase/server";

type ApplyJobPageProps = {
  jobId: string;
};

export default async function ApplyJobPage({ jobId }: ApplyJobPageProps) {
  const job = await getApplyJobData(jobId);

  if (!job) {
    notFound();
  }

  const title = getJobTitle(job);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let defaults = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, email, phone, location, level_of_experience, profile_links, resume_url, resume_file_name",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    defaults = buildApplicationDefaults(profile, user.email ?? "", user.id);
  }

  return <ApplyJobClient job={job} title={title} defaults={defaults} />;
}

export function ApplyJobNotFoundFallback() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <Badge variant="soft">Job not found</Badge>

        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          This listing isn&apos;t available
        </h1>

        <p className="mt-3 text-muted-foreground">
          This role may have been filled or removed.
        </p>

        <Button className="mt-6" asChild>
          <Link href="/jobs">Browse jobs</Link>
        </Button>
      </section>
    </main>
  );
}
