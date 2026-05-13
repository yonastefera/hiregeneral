"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkExperience } from "./profile-types";
import { createLocalId } from "./profile-utils";

type WorkExperienceSectionProps = {
  items: WorkExperience[];
  onChange: (items: WorkExperience[]) => void;
};

type WorkDateParts = {
  month: string | null;
  year: string | null;
};

const EMPTY_VALUE = "__empty__";

const MONTH_OPTIONS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const emptyExperience = (): WorkExperience => ({
  id: createLocalId("work"),
  title: "",
  company: "",
  location: "",
  start_date: "",
  end_date: null,
  is_current: false,
  description: "",
});

function getYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 70 }, (_, index) => {
    const year = currentYear + 1 - index;

    return {
      value: String(year),
      label: String(year),
    };
  });
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeSelectValue(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_VALUE;
}

function denormalizeSelectValue(value: string) {
  return value === EMPTY_VALUE ? null : value;
}

function getMonthLabel(month: string | null | undefined) {
  if (!month) return "";

  return MONTH_OPTIONS.find((option) => option.value === month)?.label ?? "";
}

function toDateValue(parts: WorkDateParts) {
  if (!parts.month || !parts.year) return "";

  return `${parts.year}-${parts.month}`;
}

function parseDateValue(value: string | null | undefined): WorkDateParts {
  if (!value) {
    return {
      month: null,
      year: null,
    };
  }

  const normalized = value.trim();

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    const [year, month] = normalized.split("-");

    return {
      month,
      year,
    };
  }

  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  const monthMatch = MONTH_OPTIONS.find((month) =>
    normalized.toLowerCase().includes(month.label.toLowerCase()),
  );

  return {
    month: monthMatch?.value ?? null,
    year: yearMatch?.[0] ?? null,
  };
}

function formatDateRange(item: WorkExperience) {
  const start = parseDateValue(item.start_date);
  const end = parseDateValue(item.end_date);

  const startLabel = [getMonthLabel(start.month), start.year]
    .filter(Boolean)
    .join(" ");

  const endLabel = item.is_current
    ? "Present"
    : [getMonthLabel(end.month), end.year].filter(Boolean).join(" ");

  if (!startLabel && !endLabel) return "";

  return `${startLabel || "Start"} - ${endLabel || "End"}`;
}

function getDescriptionPreview(description: string, expanded: boolean) {
  const normalized = description.trim();

  if (expanded || normalized.length <= 170) {
    return normalized;
  }

  return `${normalized.slice(0, 170).trim()}...`;
}

export default function WorkExperienceSection({
  items,
  onChange,
}: WorkExperienceSectionProps) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkExperience | null>(null);
  const [draft, setDraft] = useState<WorkExperience>(emptyExperience());
  const [initialDraft, setInitialDraft] =
    useState<WorkExperience>(emptyExperience());

  const [startMonth, setStartMonth] = useState<string | null>(null);
  const [startYear, setStartYear] = useState<string | null>(null);
  const [endMonth, setEndMonth] = useState<string | null>(null);
  const [endYear, setEndYear] = useState<string | null>(null);

  const [initialStartMonth, setInitialStartMonth] = useState<string | null>(
    null,
  );
  const [initialStartYear, setInitialStartYear] = useState<string | null>(null);
  const [initialEndMonth, setInitialEndMonth] = useState<string | null>(null);
  const [initialEndYear, setInitialEndYear] = useState<string | null>(null);

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const yearOptions = useMemo(() => getYearOptions(), []);

  useEffect(() => {
    if (!open) return;

    const nextDraft = editingItem ?? emptyExperience();
    const nextStartDate = parseDateValue(nextDraft.start_date);
    const nextEndDate = parseDateValue(nextDraft.end_date);

    setDraft(nextDraft);
    setInitialDraft(nextDraft);

    setStartMonth(nextStartDate.month);
    setStartYear(nextStartDate.year);
    setEndMonth(nextEndDate.month);
    setEndYear(nextEndDate.year);

    setInitialStartMonth(nextStartDate.month);
    setInitialStartYear(nextStartDate.year);
    setInitialEndMonth(nextEndDate.month);
    setInitialEndYear(nextEndDate.year);

    setRevealedDeleteId(null);
  }, [open, editingItem]);

  const hasChanges =
    normalizeText(draft.title) !== normalizeText(initialDraft.title) ||
    normalizeText(draft.company) !== normalizeText(initialDraft.company) ||
    normalizeText(draft.location) !== normalizeText(initialDraft.location) ||
    normalizeText(draft.description) !==
      normalizeText(initialDraft.description) ||
    draft.is_current !== initialDraft.is_current ||
    startMonth !== initialStartMonth ||
    startYear !== initialStartYear ||
    endMonth !== initialEndMonth ||
    endYear !== initialEndYear;

  const hasRequiredStartDate = Boolean(startMonth && startYear);
  const hasRequiredEndDate = draft.is_current || Boolean(endMonth && endYear);

  const canSave =
    hasChanges &&
    draft.title.trim().length > 0 &&
    draft.company.trim().length > 0 &&
    hasRequiredStartDate &&
    hasRequiredEndDate;

  const openAdd = () => {
    setEditingItem(null);
    setRevealedDeleteId(null);
    setOpen(true);
  };

  const openEdit = (item: WorkExperience) => {
    setEditingItem(item);
    setRevealedDeleteId(null);
    setOpen(true);
  };

  const removeItem = (id: string) => {
    setRevealedDeleteId(null);
    onChange(items.filter((item) => item.id !== id));
  };

  const save = () => {
    if (!canSave) return;

    const nextDraft: WorkExperience = {
      ...draft,
      title: draft.title.trim(),
      company: draft.company.trim(),
      location: draft.location.trim(),
      start_date: toDateValue({
        month: startMonth,
        year: startYear,
      }),
      end_date: draft.is_current
        ? null
        : toDateValue({
            month: endMonth,
            year: endYear,
          }),
      description: draft.description.trim(),
    };

    const exists = items.some((item) => item.id === nextDraft.id);

    if (exists) {
      onChange(
        items.map((item) => (item.id === nextDraft.id ? nextDraft : item)),
      );
    } else {
      onChange([nextDraft, ...items]);
    }

    setEditingItem(null);
    setOpen(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id],
    );
  };

  const handlePointerDown = (clientX: number) => {
    setDragStartX(clientX);
  };

  const handlePointerUp = (itemId: string, clientX: number) => {
    if (dragStartX === null) return;

    const deltaX = clientX - dragStartX;

    if (deltaX < -32) {
      setRevealedDeleteId(itemId);
    }

    if (deltaX > 32) {
      setRevealedDeleteId(null);
    }

    setDragStartX(null);
  };

  return (
    <section
      className="mx-auto max-w-3xl px-4 py-8"
      aria-labelledby="work-experience-heading"
    >
      <div
        className={
          items.length > 0
            ? "flex items-center justify-between gap-4"
            : "flex flex-col items-start gap-6"
        }
      >
        <h2
          id="work-experience-heading"
          className="text-2xl font-bold tracking-tight"
        >
          Work experience
        </h2>

        {items.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={openAdd}
            className="rounded-md px-5 font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add Work Experience
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={openAdd}
            className="rounded-full px-5"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add
          </Button>
        )}
      </div>

      {items.length > 0 && (
        <ul className="mt-6 space-y-5" aria-label="Work experience">
          {items.map((item) => {
            const isExpanded = expandedIds.includes(item.id);
            const isDeleteRevealed = revealedDeleteId === item.id;
            const descriptionPreview = getDescriptionPreview(
              item.description,
              isExpanded,
            );
            const shouldShowMore = item.description.trim().length > 170;

            return (
              <li
                key={item.id}
                className="relative overflow-hidden border border-[#f2f2f2] bg-white shadow-soft [border-radius:unset]"
                onPointerDown={(event) => handlePointerDown(event.clientX)}
                onPointerUp={(event) => handlePointerUp(item.id, event.clientX)}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${
                    item.title || "Work experience"
                  } card. Swipe left to reveal delete. Swipe right to hide delete.`}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") {
                      setRevealedDeleteId(item.id);
                    }

                    if (event.key === "ArrowRight" || event.key === "Escape") {
                      setRevealedDeleteId(null);
                    }
                  }}
                  className="relative bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <BriefcaseBusiness
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-foreground"
                      />

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">
                          {item.title || "Job title"}
                        </h3>

                        {item.company && (
                          <p className="mt-1.5 text-sm text-foreground">
                            {item.company}
                          </p>
                        )}

                        {formatDateRange(item) && (
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            {formatDateRange(item)}
                          </p>
                        )}

                        {descriptionPreview && (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                            {descriptionPreview}
                          </p>
                        )}

                        {shouldShowMore && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(item.id);
                            }}
                            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2 hover:text-primary"
                          >
                            {isExpanded ? "Show Less" : "Show More"}
                            <ChevronDown
                              aria-hidden="true"
                              className={[
                                "size-4 transition-transform",
                                isExpanded ? "rotate-180" : "",
                              ].join(" ")}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(item);
                      }}
                      aria-label={`Edit ${item.title || "work experience"}`}
                      className={[
                        "shrink-0 transition-[margin] duration-200 ease-out",
                        isDeleteRevealed ? "mr-20" : "mr-0",
                      ].join(" ")}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </div>

                <button
                  type="button"
                  onPointerDown={(event) => handlePointerDown(event.clientX)}
                  onPointerUp={(event) =>
                    handlePointerUp(item.id, event.clientX)
                  }
                  onClick={() => removeItem(item.id)}
                  className={[
                    "absolute inset-y-0 right-0 flex w-20 items-center justify-center",
                    "border border-[#f2f2f2] bg-white text-foreground",
                    "transition-transform duration-200 ease-out hover:bg-[#f7f7f7]",
                    isDeleteRevealed ? "translate-x-0" : "translate-x-full",
                  ].join(" ")}
                  aria-label={`Delete ${item.title || "work experience"}`}
                >
                  <Trash2 aria-hidden="true" className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-0 shadow-2xl">
          <div className="border-b border-border px-6 pb-3 pt-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Work experience
            </DialogTitle>
          </div>

          <div className="space-y-4 px-6 pb-6 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">
                Job title<span aria-hidden="true">*</span>
              </Label>

              <Input
                id="jobTitle"
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                placeholder="E.g Store Manager"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">
                Company<span aria-hidden="true">*</span>
              </Label>

              <Input
                id="company"
                value={draft.company}
                onChange={(event) =>
                  setDraft({ ...draft, company: event.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-0">
              <div className="space-y-1.5">
                <Label htmlFor="startMonth">
                  Start month<span aria-hidden="true">*</span>
                </Label>

                <Select
                  value={normalizeSelectValue(startMonth)}
                  onValueChange={(value) =>
                    setStartMonth(denormalizeSelectValue(value))
                  }
                >
                  <SelectTrigger id="startMonth" className="rounded-r-none">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>Month</SelectItem>
                    {MONTH_OPTIONS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startYear">
                  Start year<span aria-hidden="true">*</span>
                </Label>

                <Select
                  value={normalizeSelectValue(startYear)}
                  onValueChange={(value) =>
                    setStartYear(denormalizeSelectValue(value))
                  }
                >
                  <SelectTrigger
                    id="startYear"
                    className="rounded-l-none border-l-0"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>Year</SelectItem>
                    {yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0">
              <div className="space-y-1.5">
                <Label htmlFor="endMonth">
                  End month<span aria-hidden="true">*</span>
                </Label>

                <Select
                  value={normalizeSelectValue(endMonth)}
                  onValueChange={(value) =>
                    setEndMonth(denormalizeSelectValue(value))
                  }
                  disabled={draft.is_current}
                >
                  <SelectTrigger id="endMonth" className="rounded-r-none">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>Month</SelectItem>
                    {MONTH_OPTIONS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endYear">
                  End year<span aria-hidden="true">*</span>
                </Label>

                <Select
                  value={normalizeSelectValue(endYear)}
                  onValueChange={(value) =>
                    setEndYear(denormalizeSelectValue(value))
                  }
                  disabled={draft.is_current}
                >
                  <SelectTrigger
                    id="endYear"
                    className="rounded-l-none border-l-0"
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={EMPTY_VALUE}>Year</SelectItem>
                    {yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={draft.is_current}
                onCheckedChange={(checked) =>
                  setDraft({
                    ...draft,
                    is_current: checked === true,
                    end_date: checked === true ? null : draft.end_date,
                  })
                }
              />
              I currently work here
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="workDescription">Description</Label>

              <div className="rounded-md border border-input">
                <div
                  className="flex items-center gap-6 border-b border-border px-4 py-2 text-foreground"
                  aria-hidden="true"
                >
                  <span className="text-lg leading-none">≡</span>
                  <span className="text-lg leading-none">≣</span>
                </div>

                <textarea
                  id="workDescription"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="Describe your role, responsibilities, and/or accomplishments in this job"
                  className="min-h-32 w-full resize-y border-0 bg-background px-3 py-3 text-sm outline-none focus-visible:ring-0"
                />
              </div>

              <p className="text-xs text-muted-foreground">Optional</p>
            </div>

            <Button
              type="button"
              className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={save}
              disabled={!canSave}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
