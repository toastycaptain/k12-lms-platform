"use client";

import { useState } from "react";
import { LearningStoryFeed } from "@/features/ib/guardian/LearningStoryFeed";
import { StudentSwitcher } from "@/features/ib/guardian/StudentSwitcher";
import { HowToHelpPanel } from "@/features/ib/guardian/HowToHelpPanel";
import { FamilyResponseComposer } from "@/features/ib/guardian/FamilyResponseComposer";
import { AcknowledgeButton } from "@/features/ib/guardian/AcknowledgeButton";
import { NarrativeRefinementPanel } from "@/features/ib/families/NarrativeRefinementPanel";
import { ChannelStrategyPanel } from "@/features/ib/families/ChannelStrategyPanel";
import { GuardianPreferencesSheet } from "@/features/ib/guardian/GuardianPreferencesSheet";

export function FamilyHomeV2({
  students,
  stories,
  howToHelp,
  digestStrategy,
  preferences,
}: {
  students: Array<{ id: number; label: string; relationship: string }>;
  stories: Array<{
    id: number;
    title: string;
    summary?: string | null;
    supportPrompt?: string | null;
    translationState?: string;
  }>;
  howToHelp: Array<{ id: number; title: string; prompt: string }>;
  digestStrategy: { urgentCount: number; cadenceOptions: string[] };
  preferences: Record<string, { email_frequency: string }>;
}) {
  const [activeStudentId, setActiveStudentId] = useState<number | null>(students[0]?.id ?? null);

  return (
    <div className="space-y-5">
      <StudentSwitcher
        students={students}
        activeId={activeStudentId}
        onChange={setActiveStudentId}
      />
      <LearningStoryFeed
        stories={stories.map((story) => ({
          id: story.id,
          title: story.title,
          detail: story.summary || "",
          prompt: story.supportPrompt || "",
        }))}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <HowToHelpPanel rows={howToHelp} />
        <NarrativeRefinementPanel stories={stories} />
      </div>
      {stories[0] ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
          <FamilyResponseComposer entityRef={`ib_learning_story:${stories[0].id}`} />
          <AcknowledgeButton entityRef={`ib_learning_story:${stories[0].id}`} />
        </div>
      ) : null}
      <ChannelStrategyPanel
        urgentCount={digestStrategy.urgentCount}
        cadenceOptions={digestStrategy.cadenceOptions}
      />
      <GuardianPreferencesSheet preferences={preferences} />
    </div>
  );
}
