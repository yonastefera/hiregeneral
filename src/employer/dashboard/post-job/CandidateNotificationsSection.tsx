import { Mail } from "lucide-react";

import { PostJobField } from "./PostJobField";
import { PostJobSection } from "./PostJobSection";
import { inputClassName } from "./post-job-content";

type CandidateNotificationsSectionProps = {
  defaultEmail?: string;
};

export function CandidateNotificationsSection({
  defaultEmail,
}: CandidateNotificationsSectionProps) {
  return (
    <PostJobSection title="Candidate notifications" icon={Mail}>
      <PostJobField label="Email for new candidate alerts">
        <input
          name="notificationEmail"
          type="email"
          defaultValue={defaultEmail}
          placeholder="recruiting@company.com"
          className={inputClassName}
        />
      </PostJobField>
    </PostJobSection>
  );
}
