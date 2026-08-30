import { CheckCircle2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApplicationAssistantResult } from "@/lib/applications/application-assistant";

type ApplicationAssistantProps = {
  result: ApplicationAssistantResult;
  onUseStarter: () => void;
};

export default function ApplicationAssistant({
  result,
  onUseStarter,
}: ApplicationAssistantProps) {
  return (
    <aside className="space-y-4 rounded-xl border border-border bg-muted/35 p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary"
        />
        <div>
          <h3 className="font-semibold">Evidence-based application coach</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Built privately from this job and your saved profile. No external AI
            service receives your information.
          </p>
        </div>
      </div>

      {result.matchedSkills.length > 0 && (
        <div>
          <p className="text-sm font-medium">Profile evidence that matches</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.matchedSkills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-2 text-sm">
        {result.prompts.map((prompt) => (
          <li key={prompt} className="flex gap-2">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <span>{prompt}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onUseStarter}
        >
          Use factual starter
        </Button>
        <p className="text-xs text-muted-foreground">
          Review and personalize it before submitting.
        </p>
      </div>
    </aside>
  );
}
