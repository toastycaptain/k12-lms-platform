export interface WorkflowEvent {
  event: string;
  label: string;
  confirm?: string | null;
  requires_comment?: boolean;
  comment_label?: string | null;
}

export interface WorkflowMeta {
  state: string;
  available_events: WorkflowEvent[];
}
