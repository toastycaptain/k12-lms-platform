"use client";

import { useState } from "react";
import { RichTextComposer, SegmentedControl } from "@k12/ui";
import type { LearningStory } from "@/features/curriculum/evidence/types";

interface LearningStoryComposerProps {
  onPublish: (story: LearningStory) => void;
}

export function LearningStoryComposer({ onPublish }: LearningStoryComposerProps) {
  const [title, setTitle] = useState("Story title");
  const [narrative, setNarrative] = useState(
    "Share the learning move that mattered, what evidence made it visible, and how families can extend the conversation at home.",
  );
  const [familyPrompt, setFamilyPrompt] = useState(
    "Ask your child what changed between the first attempt and the version they shared.",
  );
  const [notificationLevel, setNotificationLevel] = useState<
    "digest" | "important" | "celebration"
  >("digest");

  return (
    <section className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Learning story composer</h2>
        <p className="mt-1 text-sm text-slate-600">
          Narrative first, family-friendly language, and visible notification intent.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Title
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
        />
      </label>

      <RichTextComposer
        label="Narrative"
        value={narrative}
        onChange={(event) => setNarrative(event.target.value)}
      />

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Family prompt
        </span>
        <textarea
          value={familyPrompt}
          onChange={(event) => setFamilyPrompt(event.target.value)}
          className="mt-2 min-h-[7rem] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
        />
      </label>

      <SegmentedControl
        label="Notification level"
        value={notificationLevel}
        onChange={(next) => setNotificationLevel(next as "digest" | "important" | "celebration")}
        options={[
          { value: "digest", label: "Digest" },
          { value: "important", label: "Important" },
          { value: "celebration", label: "Celebration" },
        ]}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            onPublish({
              id: `story-${Date.now()}`,
              title,
              narrative,
              programme: "PYP",
              unitTitle: "Sharing the Planet",
              audience: "family",
              learnerProfileSummary: "Visible growth in reflection and communication",
              familyPrompt,
              linkedEvidenceIds: [],
              notificationLevel,
              updatedAt: "Just now",
            })
          }
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Publish family-ready story
        </button>
      </div>
    </section>
  );
}
