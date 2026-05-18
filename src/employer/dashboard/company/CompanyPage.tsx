import { CompanyAboutSection } from "./CompanyAboutSection";
import { CompanyDetailsSection } from "./CompanyDetailsSection";
import { CompanyProfileHeader } from "./CompanyProfileHeader";
import { companyProfile } from "./company-content";

export function CompanyPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Company profile
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          How candidates see your brand on HireGeneral.
        </p>
      </div>

      <CompanyProfileHeader company={companyProfile} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompanyDetailsSection company={companyProfile} />
        <CompanyAboutSection company={companyProfile} />
      </div>
    </div>
  );
}
