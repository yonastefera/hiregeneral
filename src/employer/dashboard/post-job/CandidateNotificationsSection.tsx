import { Mail } from "lucide-react";

import { PostJobField } from "./PostJobField";
import { PostJobSection } from "./PostJobSection";
import { inputClassName } from "./post-job-content";

export function CandidateNotificationsSection() {
  return (
    <PostJobSection title="Candidate notifications" icon={Mail}>
      <PostJobField label="Email for new candidate alerts">
        <input
          type="email"
          placeholder="recruiting@company.com"
          className={inputClassName}
        />
      </PostJobField>
    </PostJobSection>
  );
}
