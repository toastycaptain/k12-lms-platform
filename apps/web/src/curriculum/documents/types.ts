import type { PackRuntimeSubset } from "@/curriculum/runtime/types";
import type { WorkflowMeta } from "@/curriculum/workflow/types";
import type { FrameworkNode } from "@/curriculum/frameworks/types";

export interface CurriculumDocumentVersion {
  id: number;
  tenant_id?: number;
  curriculum_document_id: number;
  version_number: number;
  title: string;
  content: Record<string, unknown>;
  created_by_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumDocument {
  id: number;
  tenant_id?: number;
  school_id: number;
  academic_year_id?: number | null;
  planning_context_id: number;
  document_type: string;
  title: string;
  status: string;
  current_version_id?: number | null;
  created_by_id?: number;
  pack_key?: string;
  pack_version?: string;
  schema_key: string;
  pack_payload_checksum?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  current_version?: CurriculumDocumentVersion | null;
  workflow?: WorkflowMeta;
  curriculum_runtime?: PackRuntimeSubset;
}

export interface CurriculumDocumentLink {
  id: number;
  tenant_id?: number;
  source_document_id: number;
  target_document_id: number;
  relationship_type: string;
  position: number;
  metadata?: Record<string, unknown>;
  target_document?: {
    id: number;
    title: string;
    document_type: string;
    schema_key: string;
    status: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface CurriculumDocumentAlignment {
  id?: number;
  standard_id: number;
  alignment_type?: string;
  metadata?: Record<string, unknown>;
  standard?: FrameworkNode;
}

export interface UseCurriculumDocumentsParams {
  page?: number;
  per_page?: number;
  planning_context_id?: number;
  document_type?: string;
  status?: string;
  school_id?: number;
  academic_year_id?: number;
  q?: string;
}
