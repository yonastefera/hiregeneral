import { PostJobField } from "./PostJobField";
import { PostJobSection } from "./PostJobSection";
import { inputClassName } from "./post-job-content";

export function JobDescriptionSection() {
  return (
    <PostJobSection title="Job description">
      <PostJobField label="Describe the role, responsibilities and ideal candidate">
        <textarea
          rows={6}
          placeholder="What will this person do? What does success look like?"
          className={`${inputClassName} min-h-35 resize-y py-2`}
        />
      </PostJobField>

      <div className="mt-3">
        <PostJobField label="Skills (optional)">
          <input
            placeholder="React, TypeScript, Figma — comma separated"
            className={inputClassName}
          />
        </PostJobField>
      </div>
    </PostJobSection>
  );
}
