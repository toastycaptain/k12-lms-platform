import type { PackRuntimeSubset } from "@/curriculum/runtime/types";

export interface PlanningContext {
  id: number;
  tenant_id?: number;
  school_id: number;
  academic_year_id?: number | null;
  kind: string;
  name: string;
  status: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_by_id?: number;
  course_ids: number[];
  created_at?: string;
  updated_at?: string;
  curriculum_runtime?: PackRuntimeSubset;
}

export interface UsePlanningContextsParams {
  page?: number;
  per_page?: number;
  kind?: string;
  academic_year_id?: number;
  school_id?: number;
}
