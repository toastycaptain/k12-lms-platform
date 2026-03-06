"use client";

import { useMemo, useState } from "react";
import type {
  EvidenceItem,
  EvidenceVisibility,
  LearningStory,
} from "@/features/curriculum/evidence/types";

const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: "evidence-pyp-river",
    title: "River systems prototype",
    description:
      "Students built a water-flow model, documented testing decisions, and connected choices to systems thinking.",
    reflection:
      "I changed the water gate three times because the first version flooded too quickly. Next time I want to explain the cause more clearly.",
    programme: "PYP",
    unitTitle: "Sharing the Planet",
    learner: "Lina Peterson",
    visibility: "family",
    validationState: "validated",
    learnerProfileTags: ["Caring", "Thinker"],
    atlTags: ["Research", "Communication"],
    conceptTags: ["Systems", "Responsibility"],
    contextTags: ["Action", "Family Window"],
    attachments: [
      { id: "a1", label: "Prototype photo", kind: "image" },
      { id: "a2", label: "Voice reflection", kind: "video" },
    ],
    comments: [
      {
        id: "c1",
        author: "Amina Coordinator",
        body: "Strong evidence of systems thinking. Add one sentence on how the family prompt will frame the learning.",
        timestamp: "Today",
      },
    ],
    updatedAt: "Today, 9:10 AM",
  },
  {
    id: "evidence-myp-campaign",
    title: "Community campaign storyboard",
    description:
      "Draft sequence for a service-as-action campaign connecting local transport choices to sustainability.",
    reflection:
      "My strongest criterion evidence is explaining how the visuals persuade the audience. I still need a clearer factual question.",
    programme: "MYP",
    unitTitle: "Design for Sustainable Futures",
    learner: "Owen Patel",
    visibility: "teacher",
    validationState: "submitted",
    learnerProfileTags: ["Communicator"],
    atlTags: ["Creative thinking", "Collaboration"],
    conceptTags: ["Communication", "Communities"],
    contextTags: ["Global context", "Service as action"],
    attachments: [{ id: "a3", label: "Storyboard PDF", kind: "document" }],
    comments: [
      {
        id: "c2",
        author: "Tara Teacher",
        body: "The context is strong. Tie the storyboard beats more directly to Criterion B evidence.",
        timestamp: "Yesterday",
      },
    ],
    updatedAt: "Yesterday, 3:40 PM",
  },
  {
    id: "evidence-dp-ee",
    title: "Extended Essay research checkpoint",
    description:
      "Research log and annotated source set for an EE draft on urban food systems and waste reduction.",
    reflection:
      "My sources are getting more balanced. I need to tighten the method notes before the next supervision meeting.",
    programme: "DP",
    unitTitle: "Extended Essay",
    learner: "Maya Chen",
    visibility: "student",
    validationState: "draft",
    learnerProfileTags: ["Inquirer", "Reflective"],
    atlTags: ["Self-management", "Research"],
    conceptTags: ["Perspective"],
    contextTags: ["EE", "Academic honesty"],
    attachments: [
      { id: "a4", label: "Research notes", kind: "document" },
      { id: "a5", label: "Source tracker", kind: "document" },
    ],
    comments: [
      {
        id: "c3",
        author: "EE Supervisor",
        body: "Method notes are moving in the right direction. Bring one counterargument source into the next draft.",
        timestamp: "This week",
      },
    ],
    updatedAt: "This week",
  },
];

const INITIAL_STORIES: LearningStory[] = [
  {
    id: "story-water",
    title: "Learning how water systems respond to change",
    narrative:
      "Students explored how small design choices created very different water-flow patterns. They tested, reflected, and revised with visible persistence.",
    programme: "PYP",
    unitTitle: "Sharing the Planet",
    audience: "family",
    learnerProfileSummary: "Thinker and Caring in action",
    familyPrompt:
      "Ask your child what changed after the first prototype and why they chose the final gate design.",
    linkedEvidenceIds: ["evidence-pyp-river"],
    notificationLevel: "digest",
    updatedAt: "Today",
  },
  {
    id: "story-campaign",
    title: "Turning sustainability questions into action",
    narrative:
      "Learners shaped campaign prototypes that connect local transport habits to community impact. Feedback is focusing the message before publication.",
    programme: "MYP",
    unitTitle: "Design for Sustainable Futures",
    audience: "family",
    learnerProfileSummary: "Communicator and principled collaboration",
    familyPrompt:
      "Invite your child to explain which audience they are persuading and what evidence matters most.",
    linkedEvidenceIds: ["evidence-myp-campaign"],
    notificationLevel: "important",
    updatedAt: "Yesterday",
  },
];

export function useEvidenceFeed() {
  const [items, setItems] = useState<EvidenceItem[]>(INITIAL_EVIDENCE);
  const [search, setSearch] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState<EvidenceVisibility | "all">("all");

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesVisibility =
        selectedVisibility === "all" || item.visibility === selectedVisibility;
      if (!matchesVisibility) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        item.title,
        item.description,
        item.unitTitle,
        ...item.learnerProfileTags,
        ...item.atlTags,
        ...item.conceptTags,
        ...item.contextTags,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [items, search, selectedVisibility]);

  function updateItem(evidenceId: string, updater: (item: EvidenceItem) => EvidenceItem) {
    setItems((current) => current.map((item) => (item.id === evidenceId ? updater(item) : item)));
  }

  function addReflection(evidenceId: string, reflection: string) {
    updateItem(evidenceId, (item) => ({ ...item, reflection }));
  }

  function updateTags(
    evidenceId: string,
    field: "learnerProfileTags" | "atlTags" | "conceptTags" | "contextTags",
    nextTags: string[],
  ) {
    updateItem(evidenceId, (item) => ({ ...item, [field]: nextTags }));
  }

  function updateVisibility(evidenceId: string, visibility: EvidenceVisibility) {
    updateItem(evidenceId, (item) => ({ ...item, visibility }));
  }

  function addComment(evidenceId: string, body: string) {
    updateItem(evidenceId, (item) => ({
      ...item,
      comments: [
        ...item.comments,
        {
          id: `${evidenceId}-comment-${item.comments.length + 1}`,
          author: "Current user",
          body,
          timestamp: "Just now",
        },
      ],
    }));
  }

  return {
    items,
    filteredItems,
    search,
    setSearch,
    selectedVisibility,
    setSelectedVisibility,
    addReflection,
    updateTags,
    updateVisibility,
    addComment,
  };
}

export function useLearningStories() {
  const [stories, setStories] = useState<LearningStory[]>(INITIAL_STORIES);

  function publishStory(nextStory: LearningStory) {
    setStories((current) => [nextStory, ...current]);
  }

  return {
    stories,
    publishStory,
  };
}
