import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { HomeMarketCategory } from "./home-insights";
import { categoryStyles } from "./home-job-utils";

type HomeMarketCategoriesProps = {
  categories: HomeMarketCategory[];
};

export default function HomeMarketCategories({
  categories,
}: HomeMarketCategoriesProps) {
  return (
    <section
      className="mx-auto max-w-7xl px-6 py-20"
      aria-labelledby="home-market-heading"
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-orange-700">
          Browse by craft
        </div>

        <h2
          id="home-market-heading"
          className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl"
        >
          Find your <span className="italic text-orange-600">corner</span> of
          the market.
        </h2>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const style = categoryStyles[category.icon];
          const CategoryIcon = style.icon;

          return (
            <Link
              key={category.name}
              href={`/jobs?q=${encodeURIComponent(category.query)}`}
              className={`group flex items-center justify-between rounded-2xl bg-gradient-to-br ${style.accent} p-5 transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`}
            >
              <span className="flex items-center gap-4">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl bg-white/70 ${style.iconColor} ring-1 ring-black/5`}
                  aria-hidden="true"
                >
                  <CategoryIcon className="h-5 w-5" />
                </span>

                <span>
                  <span className="block font-semibold tracking-tight">
                    {category.name}
                  </span>
                  <span className="block text-[12px] text-neutral-700/80">
                    {category.count}
                  </span>
                </span>
              </span>

              <ChevronRight
                className="h-5 w-5 text-neutral-700 transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
