"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GraduationCap, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EducationItem } from "./profile-types";
import { createLocalId } from "./profile-utils";

type EducationSectionProps = {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
};

type SchoolSuggestion = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  label: string;
};

const EMPTY_VALUE = "__empty__";
const MIN_SCHOOL_QUERY_LENGTH = 2;
const SCHOOL_SEARCH_DEBOUNCE_MS = 150;

const DEGREE_OPTIONS = [
  "High School Diploma",
  "GED",
  "Certificate",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "BSC",
  "BA",
  "BS",
  "MBA",
  "MS",
  "MA",
  "PhD",
  "JD",
  "MD",
  "Other",
  "Not specified",
];

const SELECT_CONTENT_CLASS =
  "z-[9999] max-h-72 w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-xl border border-border bg-white p-1 text-foreground shadow-lg";

const SELECT_ITEM_CLASS =
  "relative cursor-pointer rounded-lg py-2.5 pl-9 pr-3 text-sm font-medium text-foreground focus:bg-neutral-200 focus:text-foreground data-[highlighted]:bg-neutral-200 data-[highlighted]:text-foreground data-[state=checked]:bg-neutral-200 data-[state=checked]:text-foreground";

const emptyEducation = (): EducationItem => ({
  id: createLocalId("education"),
  school_name: "",
  degree: "Not specified",
  field_of_study: null,
  start_year: null,
  end_year: null,
  is_current: false,
  description: "",
});

function getYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 80 }, (_, index) => {
    const year = currentYear + 1 - index;

    return {
      value: String(year),
      label: String(year),
    };
  });
}

function normalizeSelectValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return EMPTY_VALUE;
  }

  return String(value);
}

function denormalizeYear(value: string) {
  if (value === EMPTY_VALUE) return null;

  const year = Number(value);

  return Number.isFinite(year) ? year : null;
}

function denormalizeDegree(value: string) {
  if (value === EMPTY_VALUE) return null;

  return value;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export default function EducationSection({
  items,
  onChange,
}: EducationSectionProps) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationItem | null>(null);
  const [draft, setDraft] = useState<EducationItem>(emptyEducation());
  const [initialDraft, setInitialDraft] =
    useState<EducationItem>(emptyEducation());

  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolSuggestions, setSchoolSuggestions] = useState<
    SchoolSuggestion[]
  >([]);
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const schoolSuggestionCacheRef = useRef<Record<string, SchoolSuggestion[]>>(
    {},
  );

  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const schoolInputRef = useRef<HTMLInputElement>(null);

  const yearOptions = useMemo(() => getYearOptions(), []);

  useEffect(() => {
    if (!open) return;

    const nextDraft = editingItem ?? emptyEducation();

    setDraft({
      ...nextDraft,
      degree: nextDraft.degree ?? "Not specified",
      description: nextDraft.description ?? "",
    });

    setInitialDraft({
      ...nextDraft,
      degree: nextDraft.degree ?? "Not specified",
      description: nextDraft.description ?? "",
    });

    setSchoolQuery(nextDraft.school_name ?? "");
    setSchoolSuggestions([]);
    setShowSchoolSuggestions(false);
    setLoadingSchools(false);
    setRevealedDeleteId(null);
  }, [open, editingItem]);

  useEffect(() => {
    const query = schoolQuery.trim();
    const cacheKey = query.toLowerCase();

    if (!open || query.length < MIN_SCHOOL_QUERY_LENGTH) {
      setSchoolSuggestions([]);
      setLoadingSchools(false);
      return;
    }

    const cachedSuggestions = schoolSuggestionCacheRef.current[cacheKey];

    if (cachedSuggestions) {
      setSchoolSuggestions(cachedSuggestions);
      setLoadingSchools(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingSchools(true);

        const response = await fetch(
          `/api/schools?query=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          schools?: SchoolSuggestion[];
        };

        const nextSuggestions = payload.schools ?? [];

        schoolSuggestionCacheRef.current[cacheKey] = nextSuggestions;
        setSchoolSuggestions(nextSuggestions);
      } catch {
        // Keep existing suggestions visible to avoid flicker.
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSchools(false);
        }
      }
    }, SCHOOL_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, schoolQuery]);

  const hasChanges =
    normalizeText(draft.school_name) !==
      normalizeText(initialDraft.school_name) ||
    normalizeText(draft.degree) !== normalizeText(initialDraft.degree) ||
    normalizeText(draft.field_of_study) !==
      normalizeText(initialDraft.field_of_study) ||
    draft.start_year !== initialDraft.start_year ||
    draft.end_year !== initialDraft.end_year ||
    draft.is_current !== initialDraft.is_current ||
    normalizeText(draft.description) !==
      normalizeText(initialDraft.description);

  const canSave =
    hasChanges &&
    draft.school_name.trim().length > 0 &&
    normalizeText(draft.degree).length > 0;

  const openAdd = () => {
    setEditingItem(null);
    setRevealedDeleteId(null);
    setOpen(true);
  };

  const openEdit = (item: EducationItem) => {
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

    const nextDraft: EducationItem = {
      ...draft,
      school_name: draft.school_name.trim(),
      degree: normalizeText(draft.degree),
      field_of_study: normalizeText(draft.field_of_study) || null,
      start_year: draft.start_year,
      end_year: draft.is_current ? null : draft.end_year,
      is_current: draft.is_current,
      description: normalizeText(draft.description),
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

  const selectSchoolSuggestion = (school: SchoolSuggestion) => {
    setDraft((current) => ({
      ...current,
      school_name: school.name,
    }));

    setSchoolQuery(school.name);
    setShowSchoolSuggestions(false);
    schoolInputRef.current?.focus();
  };

  const shouldShowSchoolDropdown =
    showSchoolSuggestions &&
    schoolQuery.trim().length >= MIN_SCHOOL_QUERY_LENGTH &&
    (schoolSuggestions.length > 0 || loadingSchools);

  return (
    <section
      className="mx-auto max-w-3xl px-4 py-8"
      aria-labelledby="education-heading"
    >
      <div
        className={
          items.length > 0
            ? "flex items-center justify-between gap-4"
            : "flex flex-col items-start gap-6"
        }
      >
        <h2
          id="education-heading"
          className="text-2xl font-bold tracking-tight"
        >
          Education
        </h2>

        {items.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={openAdd}
            className="rounded-md px-5 font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add Education
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
        <ul className="mt-6 space-y-5" aria-label="Education">
          {items.map((item) => {
            const isDeleteRevealed = revealedDeleteId === item.id;

            return (
              <li
                key={item.id}
                className="relative overflow-hidden border border-[#f2f2f2] bg-white shadow-soft rounded-[unset]"
                onPointerDown={(event) => handlePointerDown(event.clientX)}
                onPointerUp={(event) => handlePointerUp(item.id, event.clientX)}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${
                    item.school_name || "Education"
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
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <GraduationCap
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-foreground"
                      />

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">
                          {item.school_name || "School"}
                        </h3>

                        {item.degree && (
                          <p className="mt-1.5 text-sm text-foreground">
                            {item.degree}
                          </p>
                        )}

                        {(item.start_year ||
                          item.end_year ||
                          item.is_current) && (
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            {item.start_year ? item.start_year : ""}
                            {item.start_year || item.end_year || item.is_current
                              ? " - "
                              : ""}
                            {item.is_current
                              ? "Present"
                              : item.end_year
                                ? item.end_year
                                : ""}
                          </p>
                        )}

                        {item.description && (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
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
                      aria-label={`Edit ${item.school_name || "education"}`}
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
                  aria-label={`Delete ${item.school_name || "education"}`}
                >
                  <Trash2 aria-hidden="true" className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[84vh] max-w-sm overflow-y-auto rounded-xl border border-border bg-background p-0 shadow-2xl sm:max-w-md">
          <div className="px-5 pb-2 pt-5">
            <DialogTitle className="text-xl font-bold tracking-tight">
              Education
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add or edit your school, degree, field of study, attendance dates,
              and education description.
            </DialogDescription>
          </div>

          <div className="space-y-3.5 px-5 pb-5">
            <div className="relative space-y-1.5">
              <Label htmlFor="schoolName">
                School<span aria-hidden="true">*</span>
              </Label>

              <div className="relative">
                <Input
                  ref={schoolInputRef}
                  id="schoolName"
                  value={schoolQuery}
                  onFocus={() => {
                    setShowSchoolSuggestions(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setShowSchoolSuggestions(false);
                    }, 150);
                  }}
                  onChange={(event) => {
                    const value = event.target.value;

                    setSchoolQuery(value);
                    setDraft((current) => ({
                      ...current,
                      school_name: value,
                    }));
                    setShowSchoolSuggestions(true);
                  }}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={shouldShowSchoolDropdown}
                  aria-controls="school-suggestion-list"
                />

                {schoolQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSchoolQuery("");
                      setDraft((current) => ({
                        ...current,
                        school_name: "",
                      }));
                      setSchoolSuggestions([]);
                      setShowSchoolSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear school"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                )}
              </div>

              {schoolQuery.trim().length > 0 &&
                schoolQuery.trim().length < MIN_SCHOOL_QUERY_LENGTH && (
                  <p className="text-xs text-muted-foreground">
                    Type at least {MIN_SCHOOL_QUERY_LENGTH} characters to search
                    schools.
                  </p>
                )}

              {shouldShowSchoolDropdown && (
                <ul
                  id="school-suggestion-list"
                  className="absolute left-0 right-0 top-full z-9999 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-background py-2 shadow-lg"
                  role="listbox"
                >
                  {schoolSuggestions.map((school) => (
                    <li key={school.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSchoolSuggestion(school)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium">{school.name}</span>

                        {(school.city || school.state) && (
                          <span className="block text-xs text-muted-foreground">
                            {[school.city, school.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}

                  {loadingSchools && schoolSuggestions.length === 0 && (
                    <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2
                        aria-hidden="true"
                        className="size-3.5 animate-spin"
                      />
                      Searching schools...
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="degree">
                Degree<span aria-hidden="true">*</span>
              </Label>

              <Select
                value={normalizeSelectValue(draft.degree)}
                onValueChange={(value) =>
                  setDraft({
                    ...draft,
                    degree: denormalizeDegree(value),
                  })
                }
              >
                <SelectTrigger
                  id="degree"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base shadow-none focus:ring-2 focus:ring-[#0c8f8f]"
                >
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  avoidCollisions={false}
                  className={SELECT_CONTENT_CLASS}
                >
                  {DEGREE_OPTIONS.map((degree) => (
                    <SelectItem
                      key={degree}
                      value={degree}
                      className={SELECT_ITEM_CLASS}
                    >
                      {degree}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="major">Major</Label>

              <Input
                id="major"
                value={draft.field_of_study ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, field_of_study: event.target.value })
                }
                placeholder="Describe what you studied"
              />

              <p className="text-xs text-muted-foreground">Optional</p>
            </div>

            <div className="grid grid-cols-2 gap-0">
              <div className="space-y-1.5">
                <Label htmlFor="startYear">Start year</Label>

                <Select
                  value={normalizeSelectValue(draft.start_year)}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      start_year: denormalizeYear(value),
                    })
                  }
                >
                  <SelectTrigger
                    id="startYear"
                    className="h-12 w-full rounded-r-none border border-input bg-background px-4 text-base shadow-none focus:ring-2 focus:ring-[#0c8f8f]"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions={false}
                    className={SELECT_CONTENT_CLASS}
                  >
                    <SelectItem
                      value={EMPTY_VALUE}
                      className={SELECT_ITEM_CLASS}
                    >
                      Not specified
                    </SelectItem>

                    {yearOptions.map((year) => (
                      <SelectItem
                        key={year.value}
                        value={year.value}
                        className={SELECT_ITEM_CLASS}
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground">Optional</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endYear">End year</Label>

                <Select
                  value={normalizeSelectValue(draft.end_year)}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      end_year: denormalizeYear(value),
                    })
                  }
                  disabled={draft.is_current}
                >
                  <SelectTrigger
                    id="endYear"
                    className="h-12 w-full rounded-l-none border border-l-0 border-input bg-background px-4 text-base shadow-none focus:ring-2 focus:ring-[#0c8f8f]"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions={false}
                    className={SELECT_CONTENT_CLASS}
                  >
                    <SelectItem
                      value={EMPTY_VALUE}
                      className={SELECT_ITEM_CLASS}
                    >
                      Not specified
                    </SelectItem>

                    {yearOptions.map((year) => (
                      <SelectItem
                        key={year.value}
                        value={year.value}
                        className={SELECT_ITEM_CLASS}
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground">Optional</p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={draft.is_current}
                onCheckedChange={(checked) =>
                  setDraft({
                    ...draft,
                    is_current: checked === true,
                    end_year: checked === true ? null : draft.end_year,
                  })
                }
              />
              I currently attend
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="educationDescription">Description</Label>

              <textarea
                id="educationDescription"
                value={draft.description ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                placeholder="Describe what you learned or accomplished."
                className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <p className="text-xs text-muted-foreground">Optional</p>
            </div>

            <Button
              type="button"
              className="mt-1 w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
