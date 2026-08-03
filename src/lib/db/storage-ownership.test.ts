import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const storageMigration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260802_storage_ownership_hardening.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const profileMigration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260802_rls_authorization_hardening.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("direct profile and storage mutation boundaries", () => {
  it.each([
    ["resumes", "5242880"],
    ["avatars", "2097152"],
  ])("sets a server-side size and MIME boundary for %s", (bucket, bytes) => {
    expect(storageMigration).toContain(`'${bucket}'`);
    expect(storageMigration).toContain(bytes);
    expect(storageMigration).toContain("allowed_mime_types");
  });

  it("restricts every avatar operation to the authenticated owner folder", () => {
    for (const operation of ["INSERT", "SELECT", "UPDATE", "DELETE"]) {
      expect(storageMigration).toContain(
        `ON storage.objects FOR ${operation} TO authenticated`,
      );
    }

    expect(
      storageMigration.match(
        /auth\.uid\(\)::text = \(storage\.foldername\(name\)\)\[1\]/g,
      ),
    ).toHaveLength(5);
  });

  it("keeps profile identity and role immutable to ordinary owners", () => {
    expect(profileMigration).toContain("protect_profile_identity");
    expect(profileMigration).toContain(
      "NEW.user_id IS DISTINCT FROM OLD.user_id",
    );
    expect(profileMigration).toContain(
      "NEW.user_type IS DISTINCT FROM OLD.user_type",
    );
  });
});
