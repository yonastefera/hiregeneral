import { DollarSign } from "lucide-react";

import { PostJobField } from "./PostJobField";
import { PostJobSection } from "./PostJobSection";
import {
  currencyOptions,
  inputClassName,
  payFrequencyOptions,
} from "./post-job-content";

type PayRangeSectionProps = {
  defaultValues?: {
    salaryMin?: string;
    salaryMax?: string;
    salaryCurrency?: string;
    payFrequency?: string;
  };
};

export function PayRangeSection({ defaultValues }: PayRangeSectionProps) {
  return (
    <PostJobSection title="Pay range" icon={DollarSign}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <PostJobField label="Minimum">
          <input
            name="salaryMin"
            inputMode="numeric"
            defaultValue={defaultValues?.salaryMin}
            placeholder="60,000"
            className={inputClassName}
          />
        </PostJobField>

        <PostJobField label="Maximum">
          <input
            name="salaryMax"
            inputMode="numeric"
            defaultValue={defaultValues?.salaryMax}
            placeholder="90,000"
            className={inputClassName}
          />
        </PostJobField>

        <PostJobField label="Currency">
          <select
            name="salaryCurrency"
            defaultValue={defaultValues?.salaryCurrency ?? "USD"}
            className={inputClassName}
          >
            {currencyOptions.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </PostJobField>

        <PostJobField label="Frequency">
          <select
            name="payFrequency"
            defaultValue={defaultValues?.payFrequency ?? "Per year"}
            className={inputClassName}
          >
            {payFrequencyOptions.map((frequency) => (
              <option key={frequency}>{frequency}</option>
            ))}
          </select>
        </PostJobField>
      </div>
    </PostJobSection>
  );
}
