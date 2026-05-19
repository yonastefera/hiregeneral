import { trustedBrands } from "./employer-landing-content";

export function EmployerLogoStrip() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <div className="pt-14 text-center text-[11px] uppercase tracking-[0.2em] text-neutral-500">
        Trusted by hiring teams at
      </div>

      <div className="mt-6 grid grid-cols-2 items-center gap-x-8 gap-y-4 opacity-70 sm:grid-cols-3 md:grid-cols-6">
        {trustedBrands.map((brand) => (
          <div
            key={brand}
            className="text-center text-lg font-semibold tracking-tight text-neutral-700"
          >
            {brand}
          </div>
        ))}
      </div>
    </section>
  );
}
