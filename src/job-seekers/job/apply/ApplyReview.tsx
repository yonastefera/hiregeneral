import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import type { ApplyFormValues } from "./apply-utils";

type ApplyReviewProps = {
  values: ApplyFormValues;
  resumeName: string;
  agreeError?: string;
  onAgreeChange: (checked: boolean) => void;
  onEdit: (step: number) => void;
};

export default function ApplyReview({
  values,
  resumeName,
  agreeError,
  onAgreeChange,
  onEdit,
}: ApplyReviewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 md:p-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Review your application
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Make sure everything looks right before submitting.
        </p>

        <dl className="mt-6 divide-y divide-border text-sm">
          <ReviewRow
            label="Full name"
            value={values.fullName}
            onEdit={() => onEdit(1)}
          />

          <ReviewRow
            label="Email"
            value={values.email}
            onEdit={() => onEdit(1)}
          />

          {values.phone && (
            <ReviewRow
              label="Phone"
              value={values.phone}
              onEdit={() => onEdit(1)}
            />
          )}

          {values.location && (
            <ReviewRow
              label="Location"
              value={values.location}
              onEdit={() => onEdit(1)}
            />
          )}

          {values.linkedin && (
            <ReviewRow
              label="LinkedIn"
              value={values.linkedin}
              onEdit={() => onEdit(1)}
            />
          )}

          {values.portfolio && (
            <ReviewRow
              label="Portfolio"
              value={values.portfolio}
              onEdit={() => onEdit(1)}
            />
          )}

          <ReviewRow
            label="Resume"
            value={resumeName}
            onEdit={() => onEdit(2)}
          />

          <ReviewRow
            label="Years of experience"
            value={values.yearsExp || "—"}
            onEdit={() => onEdit(3)}
          />

          <ReviewRow
            label="Work authorization"
            value={values.workAuth || "—"}
            onEdit={() => onEdit(3)}
          />

          <ReviewRow
            label="Sponsorship"
            value={values.requireSponsorship}
            onEdit={() => onEdit(3)}
          />

          {values.coverNote && (
            <div className="py-3">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Cover note</dt>

                <button
                  type="button"
                  onClick={() => onEdit(3)}
                  className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Edit
                </button>
              </div>

              <dd className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                {values.coverNote}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={values.agree}
            onCheckedChange={(value) => onAgreeChange(Boolean(value))}
            className="mt-0.5"
            aria-invalid={Boolean(agreeError)}
            aria-describedby={agreeError ? "agree-error" : undefined}
          />

          <span className="text-sm leading-6 text-muted-foreground">
            I confirm that the information provided is accurate, and I agree to
            HireGeneral&apos;s{" "}
            <Link
              href="/terms"
              className="font-medium text-primary hover:underline"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {agreeError && (
          <p id="agree-error" className="mt-3 text-sm text-destructive">
            {agreeError}
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>

      <div className="flex items-center gap-3">
        <dd className="max-w-[16rem] truncate text-right font-medium text-foreground">
          {value}
        </dd>

        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
