import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260816053000_separate_profile_demographics.sql",
  ),
  "utf8",
);

describe("profile demographics separation migration", () => {
  it("copies then clears all legacy demographic columns", () => {
    expect(
      migration.indexOf("INSERT INTO public.profile_demographics"),
    ).toBeLessThan(migration.indexOf("UPDATE public.profiles"));
    for (const column of [
      "gender",
      "gender_self_describe",
      "ethnicity",
      "ethnicity_self_describe",
      "veteran_status",
      "disability_status",
    ]) {
      expect(migration).toContain(`${column} = NULL`);
      expect(migration).toContain(`${column} IS NULL`);
    }
  });

  it("allows owners only and grants nothing to anon", () => {
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.profile_demographics FROM PUBLIC, anon",
    );
    expect(migration).not.toMatch(
      /CREATE POLICY[\s\S]*?public\.has_role\(auth\.uid\(\), 'admin'\)/i,
    );
  });

  it("removes separated data when account deletion is prepared", () => {
    expect(migration).toContain("delete_demographics_for_deleted_profile");
    expect(migration).toContain(
      "DELETE FROM public.profile_demographics WHERE profile_id = NEW.id",
    );
  });
});
