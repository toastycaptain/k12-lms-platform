export const IB_EVENT_FAMILIES = [
  "teacher_workflow",
  "specialist_workflow",
  "coordinator_intelligence",
  "student_journey",
  "family_experience",
  "search_and_navigation",
  "performance",
] as const;

export type IbEventFamily = (typeof IB_EVENT_FAMILIES)[number];

export type IbSurface =
  | "teacher_home"
  | "teacher_studio"
  | "evidence_inbox"
  | "publishing_queue"
  | "review_queue"
  | "specialist_dashboard"
  | "operations_center"
  | "student_home"
  | "family_home"
  | "search"
  | "performance";

export interface IbEventPayload {
  eventName: string;
  eventFamily: IbEventFamily;
  surface: IbSurface;
  programme?: "PYP" | "MYP" | "DP" | "Mixed";
  routeId?: string;
  entityRef?: string;
  documentType?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}
