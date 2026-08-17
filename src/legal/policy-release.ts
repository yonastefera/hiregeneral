export type LegalApprovalStatus = "pending_counsel" | "published";

export const legalPolicyRelease = Object.freeze({
  approvalStatus: "pending_counsel" as LegalApprovalStatus,
  termsVersion: "terms-2026-08-16-draft",
  privacyVersion: "privacy-2026-08-16-draft",
  proposedEffectiveDate: "August 16, 2026",
  acceptanceRequired: false as boolean,
});

export type LegalAcceptancePayload = {
  termsVersion: string;
  privacyVersion: string;
};

export function isCurrentPublishedAcceptance(
  acceptance: LegalAcceptancePayload | undefined,
) {
  return (
    legalPolicyRelease.approvalStatus === "published" &&
    legalPolicyRelease.acceptanceRequired &&
    acceptance?.termsVersion === legalPolicyRelease.termsVersion &&
    acceptance.privacyVersion === legalPolicyRelease.privacyVersion
  );
}
