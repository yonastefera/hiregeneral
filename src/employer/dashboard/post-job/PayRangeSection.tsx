import { DollarSign } from "lucide-react";

import { PostJobField } from "./PostJobField";
import { PostJobSection } from "./PostJobSection";
import {
  currencyOptions,
  inputClassName,
  payFrequencyOptions,
} from "./post-job-content";

export function PayRangeSection() {
  return (
    <PostJobSection title="Pay range" icon={DollarSign}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <PostJobField label="Minimum">
          <input placeholder="60,000" className={inputClassName} />
        </PostJobField>

        <PostJobField label="Maximum">
          <input placeholder="90,000" className={inputClassName} />
        </PostJobField>

        <PostJobField label="Currency">
          <select className={inputClassName}>
            {currencyOptions.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </PostJobField>

        <PostJobField label="Frequency">
          <select className={inputClassName}>
            {payFrequencyOptions.map((frequency) => (
              <option key={frequency}>{frequency}</option>
            ))}
          </select>
        </PostJobField>
      </div>
    </PostJobSection>
  );
}
