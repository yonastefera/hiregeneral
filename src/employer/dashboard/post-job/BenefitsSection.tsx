import { PostJobSection } from "./PostJobSection";
import { benefitOptions } from "./post-job-content";

type BenefitsSectionProps = {
  selectedBenefits: string[];
  onToggleBenefit: (benefit: string) => void;
};

export function BenefitsSection({
  selectedBenefits,
  onToggleBenefit,
}: BenefitsSectionProps) {
  return (
    <PostJobSection title="Benefits">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {benefitOptions.map((benefit) => {
          const selected = selectedBenefits.includes(benefit);

          return (
            <button
              key={benefit}
              type="button"
              onClick={() => onToggleBenefit(benefit)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                selected
                  ? "bg-gradient-to-br from-teal-50 to-emerald-50 text-emerald-900 ring-1 ring-emerald-500/30"
                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-md ${
                  selected
                    ? "bg-emerald-500 text-white"
                    : "bg-white ring-1 ring-neutral-200"
                }`}
              >
                {selected ? (
                  <span className="text-[10px] leading-none">✓</span>
                ) : null}
              </span>

              {benefit}
            </button>
          );
        })}
      </div>
    </PostJobSection>
  );
}
