import { CompanyField } from "./CompanyField";
import {
  type CompanyProfile,
  companySizeOptions,
  industryOptions,
} from "./company-content";

type CompanyDetailsSectionProps = {
  company: CompanyProfile;
  onCompanyChange: (company: CompanyProfile) => void;
};

export function CompanyDetailsSection({
  company,
  onCompanyChange,
}: CompanyDetailsSectionProps) {
  const updateCompany = (updates: Partial<CompanyProfile>) => {
    onCompanyChange({ ...company, ...updates });
  };

  return (
    <section className="rounded-2xl bg-white p-5">
      <h3 className="mb-3 text-[14px] font-semibold">Company details</h3>

      <div className="space-y-3">
        <CompanyField label="Company name">
          <input
            value={company.name}
            onChange={(event) => updateCompany({ name: event.target.value })}
            className={inputClassName}
            required
          />
        </CompanyField>

        <CompanyField label="Website URL">
          <input
            value={company.websiteUrl}
            onChange={(event) =>
              updateCompany({ websiteUrl: event.target.value })
            }
            className={inputClassName}
            placeholder="https://company.com"
          />
        </CompanyField>

        <CompanyField label="Location">
          <input
            value={company.location}
            onChange={(event) =>
              updateCompany({ location: event.target.value })
            }
            className={inputClassName}
            placeholder="Atlanta, GA or Remote"
          />
        </CompanyField>

        <CompanyField label="Tagline">
          <input
            value={company.tagline}
            onChange={(event) => updateCompany({ tagline: event.target.value })}
            className={inputClassName}
            placeholder="A short candidate-facing positioning line"
            maxLength={160}
          />
        </CompanyField>

        <CompanyField label="Industry">
          <select
            value={company.industry}
            onChange={(event) =>
              updateCompany({ industry: event.target.value })
            }
            className={inputClassName}
          >
            {industryOptions.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </CompanyField>

        <CompanyField label="Company size">
          <select
            value={company.size}
            onChange={(event) => updateCompany({ size: event.target.value })}
            className={inputClassName}
          >
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
