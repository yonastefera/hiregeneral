import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-white px-4 py-20 text-neutral-950">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <Search aria-hidden="true" className="size-5" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">
          This page could not be found.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-600">
          The job may have closed, or the listing URL may have changed. Search
          current roles to keep going.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Browse jobs <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-teal-200 hover:text-teal-700"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
