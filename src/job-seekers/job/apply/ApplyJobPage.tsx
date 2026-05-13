import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ApplyJobClient from "./ApplyJobClient";
import { getApplyJobData } from "./apply-data";
import { getJobTitle } from "./apply-utils";

type ApplyJobPageProps = {
  jobId: string;
};

export default async function ApplyJobPage({ jobId }: ApplyJobPageProps) {
  const job = await getApplyJobData(jobId);

  if (!job) {
    notFound();
  }

  const title = getJobTitle(job);

  return <ApplyJobClient job={job} title={title} />;
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
