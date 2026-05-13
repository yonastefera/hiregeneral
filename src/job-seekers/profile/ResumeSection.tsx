"use client";

import type { ChangeEvent, RefObject } from "react";
import { useState } from "react";
import { Download, FileText, Loader2, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { JobSeekerProfile, ResumeViewState } from "./profile-types";

type ResumeSectionProps = {
  profile: JobSeekerProfile;
  resumeView: ResumeViewState;
  resumeInputRef: RefObject<HTMLInputElement | null>;
  uploadingResume: boolean;
  onResumeUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onResumeDelete: () => void;
};

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return null;

  const megabytes = bytes / 1024 / 1024;

  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const kilobytes = bytes / 1024;

  return `${Math.max(1, Math.round(kilobytes))} KB`;
}

function formatUploadedDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isPlaceholderResumeUrl(value: string) {
  return [
    "/profile/resume/view",
    "profile/resume/view",
    "/profile/resume",
    "profile/resume",
    "/resume/view",
    "resume/view",
  ].includes(value);
}

function getResumeFileName(
  profile: JobSeekerProfile,
  resumeView: ResumeViewState,
) {
  if (profile.resume_file_name?.trim()) {
    return profile.resume_file_name.trim();
  }

  if (profile.resume_url?.trim()) {
    const parts = profile.resume_url.split("/");
    return parts[parts.length - 1] || "Resume";
  }

  if (resumeView.label && resumeView.label !== "No resume uploaded yet.") {
    return resumeView.label;
  }

  return "Resume";
}

export default function ResumeSection({
  profile,
  resumeView,
  resumeInputRef,
  uploadingResume,
  onResumeUpload,
  onResumeDelete,
}: ResumeSectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteRevealed, setDeleteRevealed] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const rawResumeUrl = profile.resume_url?.trim() ?? "";

  const hasStoredResume =
    rawResumeUrl.length > 0 && !isPlaceholderResumeUrl(rawResumeUrl);

  const hasResume = hasStoredResume;

  const uploadedDate = formatUploadedDate(profile.resume_uploaded_at);
  const fileSize = formatFileSize(profile.resume_file_size);
  const fileName = getResumeFileName(profile, resumeView);

  const canPreviewResume =
    hasResume &&
    Boolean(resumeView.href) &&
    profile.resume_scan_status !== "rejected";

  const openFilePicker = () => {
    resumeInputRef.current?.click();
  };

  const openViewer = () => {
    if (!canPreviewResume) return;

    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  const handlePointerDown = (clientX: number) => {
    setDragStartX(clientX);
  };

  const handlePointerUp = (clientX: number) => {
    if (dragStartX === null) return;

    const deltaX = clientX - dragStartX;

    if (deltaX < -32) {
      setDeleteRevealed(true);
    }

    if (deltaX > 32) {
      setDeleteRevealed(false);
    }

    setDragStartX(null);
  };

  const handleDelete = () => {
    setDeleteRevealed(false);
    setViewerOpen(false);
    onResumeDelete();
  };

  return (
    <>
      <section
        className="mx-auto max-w-3xl px-4 py-8"
        aria-labelledby="resume-heading"
      >
        <input
          ref={resumeInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onResumeUpload}
          aria-label="Upload resume"
        />

        <div className="flex flex-col items-start gap-6">
          <h2 id="resume-heading" className="text-2xl font-bold tracking-tight">
            Resume
          </h2>

          {!hasResume && (
            <Button
              type="button"
              variant="outline"
              onClick={openFilePicker}
              disabled={uploadingResume}
              className="rounded-full px-5 font-semibold"
            >
              {uploadingResume ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="size-4" />
              )}
              Add Resume
            </Button>
          )}
        </div>

        {hasResume && (
          <div
            className="relative mt-6 overflow-hidden border border-[#f2f2f2] bg-white rounded-[unset]"
            onPointerDown={(event) => handlePointerDown(event.clientX)}
            onPointerUp={(event) => handlePointerUp(event.clientX)}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label="Resume card. Swipe left to reveal delete. Swipe right to hide delete."
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  setDeleteRevealed(true);
                }

                if (event.key === "ArrowRight" || event.key === "Escape") {
                  setDeleteRevealed(false);
                }
              }}
              className="relative bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <FileText
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-foreground"
                  />

                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openViewer();
                      }}
                      disabled={!canPreviewResume}
                      className="max-w-full truncate text-left text-sm font-semibold text-foreground underline-offset-2 hover:underline disabled:pointer-events-none disabled:no-underline"
                    >
                      {fileName}
                    </button>

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {uploadedDate
                        ? `Added ${uploadedDate}`
                        : "Resume uploaded"}
                      {fileSize ? ` · ${fileSize}` : ""}
                    </p>

                    {profile.resume_scan_status === "pending_scan" && (
                      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                        Security scan pending
                      </p>
                    )}

                    {profile.resume_scan_status === "rejected" && (
                      <p className="mt-1.5 text-xs font-medium text-destructive">
                        This resume could not be accepted. Please upload a
                        different PDF or Word document.
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={[
                    "flex shrink-0 items-center gap-4 transition-[margin] duration-200 ease-out",
                    deleteRevealed ? "mr-20" : "mr-0",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openFilePicker();
                    }}
                    disabled={uploadingResume}
                    className="text-sm font-semibold underline underline-offset-2 hover:text-primary disabled:pointer-events-none disabled:opacity-60"
                  >
                    Replace
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onPointerDown={(event) => handlePointerDown(event.clientX)}
              onPointerUp={(event) => handlePointerUp(event.clientX)}
              onClick={handleDelete}
              disabled={uploadingResume}
              className={[
                "absolute inset-y-0 right-0 flex w-20 items-center justify-center",
                "border border-[#f2f2f2] bg-white text-foreground",
                "transition-transform duration-200 ease-out hover:bg-[#f7f7f7]",
                "disabled:pointer-events-none disabled:opacity-60",
                deleteRevealed ? "translate-x-0" : "translate-x-full",
              ].join(" ")}
              aria-label="Delete resume"
            >
              {uploadingResume ? (
                <Loader2 aria-hidden="true" className="size-5 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        )}

        {!hasResume && (
          <p className="mt-3 text-xs text-muted-foreground">
            Accepted formats: PDF, DOC, DOCX. Maximum file size: 2 MB.
          </p>
        )}
      </section>

      {viewerOpen && canPreviewResume && resumeView.href && (
        <div
          className="fixed inset-0 z-50 bg-background"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-viewer-title"
        >
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-border px-4 py-4">
              <h2
                id="resume-viewer-title"
                className="text-2xl font-bold tracking-tight"
              >
                My Resume
              </h2>

              <button
                type="button"
                onClick={closeViewer}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close resume viewer"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </header>

            <div className="flex items-center justify-center gap-8 border-b border-border px-4 py-3 text-sm font-semibold">
              <span aria-hidden="true">−</span>
              <span>100%</span>
              <span aria-hidden="true">+</span>
            </div>

            <main className="min-h-0 flex-1 overflow-auto bg-muted/20 p-4">
              <div className="mx-auto h-full max-w-6xl overflow-hidden border border-border bg-white">
                <iframe
                  src={resumeView.href}
                  title="Resume preview"
                  className="h-full min-h-[70vh] w-full bg-white"
                />
              </div>
            </main>

            <footer className="flex items-center justify-end gap-3 border-t border-border px-4 py-3">
              <Button variant="outline" asChild>
                <a href={resumeView.href} download={fileName}>
                  <Download aria-hidden="true" className="size-4" />
                  Download
                </a>
              </Button>

              <Button type="button" onClick={closeViewer}>
                Close
              </Button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
