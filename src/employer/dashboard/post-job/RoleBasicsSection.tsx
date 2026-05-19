import { Building2, MapPin } from "lucide-react";

import { PostJobField } from "./PostJobField";
import { PostJobSection } from "./PostJobSection";
import {
  employmentTypeOptions,
  inputClassName,
  type RemoteOption,
} from "./post-job-content";

type RoleBasicsSectionProps = {
  remote: RemoteOption;
  onRemoteChange: (remote: RemoteOption) => void;
  distance: number;
  onDistanceChange: (distance: number) => void;
  employmentType: string;
  onEmploymentTypeChange: (employmentType: string) => void;
  defaultValues?: {
    title?: string;
    companyName?: string;
    location?: string;
    streetAddress?: string;
    includeRelocation?: boolean;
  };
};

export function RoleBasicsSection({
  remote,
  onRemoteChange,
  distance,
  onDistanceChange,
  employmentType,
  onEmploymentTypeChange,
  defaultValues,
}: RoleBasicsSectionProps) {
  return (
    <PostJobSection title="Role basics" icon={Building2}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PostJobField label="Job title">
          <input
            name="title"
            required
            defaultValue={defaultValues?.title}
            placeholder="e.g. Senior Product Designer"
            className={inputClassName}
          />
        </PostJobField>

        <PostJobField label="Hiring company">
          <input
            name="companyName"
            required
            defaultValue={defaultValues?.companyName}
            placeholder="Acme Inc."
            className={inputClassName}
          />
        </PostJobField>

        <PostJobField label="Job location">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              name="location"
              required
              defaultValue={defaultValues?.location}
              placeholder="Atlanta, GA"
              className={`${inputClassName} pl-8`}
            />
          </div>
        </PostJobField>

        <PostJobField label="Street address (optional)">
          <input
            name="streetAddress"
            defaultValue={defaultValues?.streetAddress}
            placeholder="123 Main Street"
            className={inputClassName}
          />
        </PostJobField>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <PostJobField label="Remote role?">
          <div className="flex gap-1.5">
            {(["yes", "no"] as const).map((remoteOption) => (
              <button
                key={remoteOption}
                type="button"
                onClick={() => onRemoteChange(remoteOption)}
                className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-medium capitalize transition-colors ${
                  remote === remoteOption
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/60"
                }`}
              >
                {remoteOption}
              </button>
            ))}
          </div>
        </PostJobField>

        <PostJobField
          label={`Applicant distance · ${
            distance === 200 ? "Unlimited" : `${distance} mi`
          }`}
        >
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={distance}
            onChange={(event) => onDistanceChange(Number(event.target.value))}
            disabled={remote === "yes"}
            className="w-full accent-emerald-500 disabled:opacity-40"
          />

          <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-600">
            <input
              name="includeRelocation"
              type="checkbox"
              defaultChecked={defaultValues?.includeRelocation ?? true}
              className="h-3 w-3 rounded text-emerald-500"
            />
            Include candidates willing to relocate
          </label>
        </PostJobField>
      </div>

      <div className="mt-3">
        <PostJobField label="Employment type">
          <div className="flex flex-wrap gap-1.5">
            {employmentTypeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onEmploymentTypeChange(type)}
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                  employmentType === type
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/60"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </PostJobField>
      </div>
    </PostJobSection>
  );
}
