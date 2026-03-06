export type JsonSchema = Record<string, unknown>;

export interface UiFieldVisibilityRule {
  path: string;
  equals?: unknown;
  not_equals?: unknown;
  exists?: boolean;
}

export interface UiFieldSpec {
  path: string;
  label?: string;
  widget?: string;
  description?: string;
  placeholder?: string;
  visible_if?: UiFieldVisibilityRule;
}

export interface UiSchemaSection {
  id?: string;
  title?: string;
  description?: string;
  fields: Array<string | UiFieldSpec>;
}

export interface UiSchema {
  layout?: "sections" | "tabs";
  sections?: UiSchemaSection[];
}

export interface DocumentSchemaDefinition {
  schema_key: string;
  data_schema: JsonSchema;
  ui_schema: UiSchema;
}
