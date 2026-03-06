export type EvidenceVisibility = "private" | "teacher" | "student" | "family" | "cohort";

export type EvidenceValidationState = "draft" | "submitted" | "validated";

export interface EvidenceComment {
  id: string;
  author: string;
  body: string;
  timestamp: string;
}

export interface EvidenceAttachment {
  id: string;
  label: string;
  kind: "image" | "video" | "document";
}

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  reflection: string;
  programme: "PYP" | "MYP" | "DP";
  unitTitle: string;
  learner: string;
  visibility: EvidenceVisibility;
  validationState: EvidenceValidationState;
  learnerProfileTags: string[];
  atlTags: string[];
  conceptTags: string[];
  contextTags: string[];
  attachments: EvidenceAttachment[];
  comments: EvidenceComment[];
  updatedAt: string;
}

export interface LearningStory {
  id: string;
  title: string;
  narrative: string;
  programme: "PYP" | "MYP" | "DP";
  unitTitle: string;
  audience: EvidenceVisibility;
  learnerProfileSummary: string;
  familyPrompt: string;
  linkedEvidenceIds: string[];
  notificationLevel: "digest" | "important" | "celebration";
  updatedAt: string;
}
