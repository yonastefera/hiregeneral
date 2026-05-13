"use client";

import { useEffect, useState } from "react";
import { Medal, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Achievement } from "./profile-types";
import { createLocalId } from "./profile-utils";

type AchievementsSectionProps = {
  items: Achievement[];
  onChange: (items: Achievement[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const emptyAchievement = (): Achievement => ({
  id: createLocalId("achievement"),
  title: "",
  description: "",
});

export default function AchievementsSection({
  items,
  onChange,
  open,
  onOpenChange,
}: AchievementsSectionProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [draft, setDraft] = useState<Achievement>(emptyAchievement());
  const [initialDraft, setInitialDraft] =
    useState<Achievement>(emptyAchievement());

  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  const setDialogOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
      return;
    }

    setInternalOpen(value);
  };

  useEffect(() => {
    if (!dialogOpen) return;

    const nextDraft = editingItem ?? emptyAchievement();

    setDraft(nextDraft);
    setInitialDraft(nextDraft);
  }, [dialogOpen, editingItem]);

  const hasChanges =
    draft.title.trim() !== initialDraft.title.trim() ||
    draft.description.trim() !== initialDraft.description.trim();

  const openAdd = () => {
    setEditingItem(null);
    setRevealedDeleteId(null);
    setDialogOpen(true);
  };

  const openEdit = (item: Achievement) => {
    setRevealedDeleteId(null);
    setEditingItem(item);
    setDialogOpen(true);
  };

  const removeItem = (id: string) => {
    setRevealedDeleteId(null);
    onChange(items.filter((item) => item.id !== id));
  };

  const save = () => {
    if (!hasChanges) return;

    const nextDraft: Achievement = {
      ...draft,
      title: draft.title.trim(),
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
    setDialogOpen(false);
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
    <>
      {items.length > 0 && (
        <section
          className="mx-auto max-w-3xl px-4 py-8"
          aria-labelledby="achievements-heading"
        >
          <div className="flex items-center justify-between gap-4">
            <h2
              id="achievements-heading"
              className="text-2xl font-bold tracking-tight"
            >
              Achievements
            </h2>

            <Button
              type="button"
              variant="outline"
              onClick={openAdd}
              className="rounded-full px-5"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add
            </Button>
          </div>

          <ul className="mt-6 space-y-5" aria-label="Achievements">
            {items.map((item) => {
              const isDeleteRevealed = revealedDeleteId === item.id;

              return (
                <li
                  key={item.id}
                  className="relative overflow-hidden border border-[#f2f2f2] bg-white shadow-soft [border-radius:unset]"
                  onPointerDown={(event) => handlePointerDown(event.clientX)}
                  onPointerUp={(event) =>
                    handlePointerUp(item.id, event.clientX)
                  }
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`${
                      item.title || "Achievement"
                    } card. Swipe left to reveal delete. Swipe right to hide delete.`}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowLeft") {
                        setRevealedDeleteId(item.id);
                      }

                      if (
                        event.key === "ArrowRight" ||
                        event.key === "Escape"
                      ) {
                        setRevealedDeleteId(null);
                      }
                    }}
                    className="relative bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Medal
                          aria-hidden="true"
                          className="size-4 shrink-0 text-foreground"
                        />

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold">
                            {item.title || "Achievement"}
                          </h3>

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
                        aria-label={`Edit ${item.title || "achievement"}`}
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
                    aria-label={`Delete ${item.title || "achievement"}`}
                  >
                    <Trash2 aria-hidden="true" className="size-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border border-border bg-background p-0 shadow-2xl">
          <div className="px-7 pb-4 pt-7">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {editingItem ? "Edit achievement" : "Achievements"}
            </DialogTitle>
          </div>

          <div className="space-y-5 px-7 pb-7">
            <div className="space-y-2">
              <Label htmlFor="achievementTitle">Title</Label>
              <Input
                id="achievementTitle"
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                placeholder="Achievement title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievementDescription">Achievement</Label>
              <textarea
                id="achievementDescription"
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                placeholder="Describe the achievement"
                className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button
              type="button"
              className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={save}
              disabled={!hasChanges}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
