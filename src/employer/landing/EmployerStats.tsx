import { platformStats } from "./employer-landing-content";

export function EmployerStats() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {platformStats.map((stat) => (
          <article key={stat.label} className="border-t border-black/10 pt-6">
            <div className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {stat.value}
            </div>
            <div className="mt-2 text-sm text-neutral-500">{stat.label}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
