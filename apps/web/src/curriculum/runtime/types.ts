export interface PackRelationshipRule {
  allowed_target_types: string[];
  max?: number;
  ordered?: boolean;
}

export interface PackDocumentType {
  label: string;
  allowed_schema_keys: string[];
  default_schema_key: string;
  allowed_statuses?: string[];
  default_status?: string;
  relationships?: Record<string, PackRelationshipRule>;
}

export interface PackDocumentSchemaIndexEntry {
  default_schema_key?: string;
  allowed_schema_keys: string[];
  allowed_statuses?: string[];
  relationships?: Record<string, PackRelationshipRule>;
  schemas?: Array<{
    schema_key: string;
    label?: string;
    document_type?: string;
  }>;
}

export interface PackDocumentSchema {
  document_type: string;
  label?: string;
  data_schema: Record<string, unknown>;
  ui_schema?: Record<string, unknown>;
}

export interface PackWorkflowEventDefinition {
  label?: string;
  from?: string[];
  to?: string;
  roles?: string[];
  confirm?: string;
  requires_comment?: boolean;
  comment_label?: string;
}

export interface PackWorkflowDefinition {
  initial_state?: string;
  events?: Record<string, PackWorkflowEventDefinition>;
}

export interface PackFrameworkBindings {
  defaults?: string[];
  allowed?: string[];
  node_kinds?: string[];
}

export interface PackCapabilityMap {
  [key: string]: unknown;
}

export interface LegacyPlannerField {
  id: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: string;
  widget?: string;
  options?: string[];
  multiline?: boolean;
  required?: boolean;
}

export interface LegacyPlannerObjectSchema {
  fields?: LegacyPlannerField[];
  defaults?: Record<string, unknown>;
}

export interface CurriculumPackV1 {
  identity?: {
    key: string;
    label?: string;
    description?: string;
    jurisdiction?: string;
  };
  versioning?: {
    version: string;
    schema_version?: string;
    compatibility?: string;
  };
  key?: string;
  label?: string;
  version?: string;
  status?: string;
  terminology?: Record<string, string>;
  navigation?: Record<string, string[]>;
  visible_navigation?: string[];
  planner_object_schemas?: Record<string, LegacyPlannerObjectSchema>;
  document_types?: Record<string, PackDocumentType>;
  document_schemas?: Record<string, PackDocumentSchema>;
  document_schema_index?: Record<string, PackDocumentSchemaIndexEntry>;
  workflow_bindings?: Record<string, string>;
  workflow_definitions?: Record<string, PackWorkflowDefinition>;
  framework_bindings?: PackFrameworkBindings;
  report_bindings?: PackCapabilityMap;
  capability_modules?: PackCapabilityMap;
  integration_hints?: PackCapabilityMap;
}

export interface PackRuntimeSubset {
  packKey: string | null;
  packVersion: string | null;
  terminology: Record<string, string>;
  plannerObjectSchemas: Record<string, LegacyPlannerObjectSchema>;
  documentTypes: Record<string, PackDocumentType>;
  documentSchemas: Record<string, PackDocumentSchema>;
  documentSchemaIndex: Record<string, PackDocumentSchemaIndexEntry>;
  workflowBindings: Record<string, string>;
  workflowDefinitions: Record<string, PackWorkflowDefinition>;
  frameworkBindings: PackFrameworkBindings;
  reportBindings: PackCapabilityMap;
  capabilityModules: PackCapabilityMap;
  integrationHints: PackCapabilityMap;
}
