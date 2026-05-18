import { CompanyField } from "./CompanyField";
import {
  companySizeOptions,
  industryOptions,
  type companyProfile,
} from "./company-content";

type Company = typeof companyProfile;

type CompanyDetailsSectionProps = {
  company: Company;
};

export function CompanyDetailsSection({ company }: CompanyDetailsSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h3 className="mb-3 text-[14px] font-semibold">Company details</h3>

      <div className="space-y-3">
        <CompanyField label="Company name">
          <input defaultValue={company.name} className={inputClassName} />
        </CompanyField>

        <CompanyField label="Website URL">
          <input defaultValue={company.websiteUrl} className={inputClassName} />
        </CompanyField>

        <CompanyField label="Industry">
          <select defaultValue={company.industry} className={inputClassName}>
            {industryOptions.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </CompanyField>

        <CompanyField label="Company size">
          <select defaultValue={company.size} className={inputClassName}>
            {companySizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </CompanyField>
      </div>
    </section>
  );
}

const inputClassName =
  "h-10 w-full rounded-lg bg-neutral-50 px-3 text-[13px] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-400/40";
