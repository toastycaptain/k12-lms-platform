import type { JsonSchema, UiFieldSpec } from "@/curriculum/schema/types";

export function inferWidget(schema: JsonSchema | null, fieldSpec?: UiFieldSpec): string {
  if (fieldSpec?.widget) {
    return fieldSpec.widget;
  }

  if (!schema) {
    return "text";
  }

  if (Array.isArray(schema.enum)) {
    return "select";
  }

  if (schema.type === "boolean") {
    return "checkbox";
  }

  if (
    schema.type === "array" &&
    schema.items &&
    typeof schema.items === "object" &&
    (schema.items as JsonSchema).type === "string"
  ) {
    return "repeatable_list";
  }

  if (
    schema.type === "string" &&
    (fieldSpec?.widget === "textarea" || Number(schema.maxLength) > 240)
  ) {
    return "textarea";
  }

  return "text";
}
