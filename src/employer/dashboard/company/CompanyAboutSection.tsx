import { Sparkles } from "lucide-react";

import { CompanyField } from "./CompanyField";
import type { companyProfile } from "./company-content";

type Company = typeof companyProfile;

type CompanyAboutSectionProps = {
  company: Company;
};

export function CompanyAboutSection({ company }: CompanyAboutSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h3 className="mb-3 text-[14px] font-semibold">About</h3>

      <CompanyField label="Mission & culture">
        <textarea
          rows={7}
          defaultValue={company.about}
          className={`${inputClassName} min-h-40 resize-y py-2`}
        />
      </CompanyField>

      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-linear-to-br from-teal-50 to-emerald-50 p-3 text-[12px] text-neutral-700">
        <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
        <p>
          Profiles with a logo and complete About section get{" "}
          <span className="font-semibold">2.4×</span> more applicants.
        </p>
      </div>
    </section>
  );
}

const inputClassName =
  "w-full rounded-lg bg-neutral-50 px-3 text-[13px] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-400/40";
