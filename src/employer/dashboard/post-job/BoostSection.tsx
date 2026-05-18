import { Sparkles } from "lucide-react";

import { PostJobSection } from "./PostJobSection";
import { boostOptions } from "./post-job-content";

type BoostSectionProps = {
  selectedBoostId: string;
  onSelectedBoostChange: (boostId: string) => void;
};

export function BoostSection({
  selectedBoostId,
  onSelectedBoostChange,
}: BoostSectionProps) {
  return (
    <PostJobSection
      title="Boost your job"
      description="Drive more traffic with featured placement."
      icon={Sparkles}
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {boostOptions.map((boost) => {
          const selected = selectedBoostId === boost.id;

          return (
            <button
              key={boost.id}
              type="button"
              onClick={() => onSelectedBoostChange(boost.id)}
              className={`group rounded-xl p-3.5 text-left transition-all ${
                selected
                  ? "bg-gradient-to-br from-teal-50 to-emerald-50 ring-2 ring-emerald-500/40"
                  : "bg-neutral-50 hover:bg-neutral-100/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold">{boost.label}</div>

                <div
                  className={`text-[13px] font-semibold ${
                    selected ? "text-emerald-700" : "text-neutral-900"
                  }`}
                >
                  {boost.price}
                </div>
              </div>

              <div className="mt-0.5 text-[11px] text-neutral-500">
                {boost.description}
              </div>
            </button>
          );
        })}
      </div>
    </PostJobSection>
  );
}
