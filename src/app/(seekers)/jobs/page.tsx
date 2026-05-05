import { Suspense } from "react";
import JobsPage from "@/components/pages/JobsPage";

export default function Jobs() {
  return (
    <Suspense fallback={<div>Loading jobs...</div>}>
      <JobsPage />
    </Suspense>
  );
}
