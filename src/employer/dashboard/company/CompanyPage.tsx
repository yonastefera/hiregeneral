"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase/client";
import { CompanyAboutSection } from "./CompanyAboutSection";
import { CompanyDetailsSection } from "./CompanyDetailsSection";
import { CompanyProfileHeader } from "./CompanyProfileHeader";
import type { CompanyProfile } from "./company-content";

type CompanyPageProps = {
  initialCompany: CompanyProfile;
};

const MAX_COMPANY_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_COMPANY_LOGO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ACCEPTED_COMPANY_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function normalizeWebsite(value: string) {
  const website = value.trim();

  if (!website) {
    return {
      websiteUrl: "",
      websiteLabel: "Add website",
    };
  }

  const websiteUrl = website.startsWith("http")
    ? website
    : `https://${website}`;

  return {
    websiteUrl,
    websiteLabel: websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
  };
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  return extension ? `.${extension.toLowerCase()}` : "";
}

function validateLogoFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!ACCEPTED_COMPANY_LOGO_EXTENSIONS.includes(extension)) {
    return "Logo must be a JPG, PNG, or WEBP image.";
  }

  if (file.type && !ACCEPTED_COMPANY_LOGO_TYPES.includes(file.type)) {
    return "Logo must be a JPG, PNG, or WEBP image.";
  }

  if (file.size > MAX_COMPANY_LOGO_BYTES) {
    return "Logo must be under 2 MB.";
  }

  return null;
}

export function CompanyPage({ initialCompany }: CompanyPageProps) {
  const [company, setCompany] = useState(initialCompany);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const website = normalizeWebsite(company.websiteUrl);
  const displayCompany = {
    ...company,
    initials: getInitials(company.name) || company.initials,
    websiteLabel: website.websiteLabel,
    websiteUrl: website.websiteUrl,
  };

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/employers/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: company.id,
          name: company.name,
          website: company.websiteUrl,
          location: company.location,
          industry: company.industry,
          size: company.size,
          tagline: company.tagline,
          description: company.about,
          logoUrl: company.logoUrl,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save company profile.");
      }

      setCompany(payload.company);
      toast.success("Company profile saved.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save company profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCompanyLogo(logoUrl: string) {
    const response = await fetch("/api/employers/company", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: company.id,
        name: company.name,
        website: company.websiteUrl,
        location: company.location,
        industry: company.industry,
        size: company.size,
        tagline: company.tagline,
        description: company.about,
        logoUrl,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not save company logo.");
    }

    setCompany(payload.company);
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = validateLogoFile(file);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingLogo(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again before uploading a logo.");
      }

      const extension = getFileExtension(file.name).replace(".", "") || "png";
      const filePath = `${user.id}/company-logo-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || "image/png",
          cacheControl: "31536000",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("company-logos").getPublicUrl(filePath);

      await saveCompanyLogo(publicUrl);
      toast.success("Company logo updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload logo.",
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={saveCompany}>
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleLogoUpload}
      />

      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Company profile
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          How candidates see your brand on HireGeneral.
        </p>
      </div>

      <CompanyProfileHeader
        company={displayCompany}
        saving={saving}
        uploadingLogo={uploadingLogo}
        onLogoClick={() => logoInputRef.current?.click()}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompanyDetailsSection company={company} onCompanyChange={setCompany} />
        <CompanyAboutSection company={company} onCompanyChange={setCompany} />
      </div>
    </form>
  );
}
