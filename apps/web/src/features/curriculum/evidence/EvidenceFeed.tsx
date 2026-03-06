"use client";

import { useMemo, useState } from "react";
import { FilterBar } from "@k12/ui";
import { EvidenceCard } from "@/features/curriculum/evidence/EvidenceCard";
import { EvidenceDetailDrawer } from "@/features/curriculum/evidence/EvidenceDetailDrawer";
import { useEvidenceFeed } from "@/features/curriculum/evidence/hooks";

export function EvidenceFeed() {
  const {
    filteredItems,
    search,
    setSearch,
    selectedVisibility,
    setSelectedVisibility,
    addComment,
    addReflection,
    updateTags,
    updateVisibility,
  } = useEvidenceFeed();
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedEvidenceId) ?? null,
    [filteredItems, selectedEvidenceId],
  );

  return (
    <div className="space-y-4">
      <FilterBar
        title="Evidence feed"
        description="Filter evidence by visibility, then open detail to validate, comment, or prepare family sharing."
        searchValue={search}
        onSearchChange={setSearch}
        controls={
          <div className="flex flex-wrap gap-2">
            {["all", "teacher", "student", "family"].map((option) => {
              const active = selectedVisibility === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setSelectedVisibility(option as "all" | "teacher" | "student" | "family")
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {option === "all" ? "All visibility" : option}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="space-y-4">
        {filteredItems.map((item) => (
          <EvidenceCard key={item.id} item={item} onOpen={() => setSelectedEvidenceId(item.id)} />
        ))}
      </div>

      <EvidenceDetailDrawer
        item={selectedItem}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedEvidenceId(null)}
        onCommentSubmit={(body) => {
          if (!selectedItem) return;
          addComment(selectedItem.id, body);
        }}
        onReflectionChange={(value) => {
          if (!selectedItem) return;
          addReflection(selectedItem.id, value);
        }}
        onVisibilityChange={(value) => {
          if (!selectedItem) return;
          updateVisibility(selectedItem.id, value);
        }}
        onTagsChange={(field, next) => {
          if (!selectedItem) return;
          updateTags(selectedItem.id, field, next);
        }}
      />
    </div>
  );
}
