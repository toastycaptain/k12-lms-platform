import type { LegacyPlannerObjectSchema } from "@/curriculum/runtime/types";
import type { DocumentSchemaDefinition } from "@/curriculum/schema/types";

function fieldSchema(field: NonNullable<LegacyPlannerObjectSchema["fields"]>[number]) {
  if (field.options && field.options.length > 0) {
    return {
      type: "string",
      enum: field.options,
      title: field.label || field.id,
      description: field.description,
    };
  }

  if (field.type === "boolean") {
    return {
      type: "boolean",
      title: field.label || field.id,
      description: field.description,
    };
  }

  if (field.type === "array") {
    return {
      type: "array",
      items: { type: "string" },
      title: field.label || field.id,
      description: field.description,
    };
  }

  return {
    type: "string",
    title: field.label || field.id,
    description: field.description,
    maxLength: field.multiline ? 4000 : 255,
  };
}

export function buildLegacySchemaDefinition(
  documentType: string,
  plannerSchema: LegacyPlannerObjectSchema | undefined,
  schemaKey: string,
): DocumentSchemaDefinition | null {
  if (!plannerSchema?.fields || plannerSchema.fields.length === 0) {
    return null;
  }

  const required = plannerSchema.fields.filter((field) => field.required).map((field) => field.id);

  return {
    schema_key: schemaKey,
    data_schema: {
      type: "object",
      required,
      properties: plannerSchema.fields.reduce<Record<string, unknown>>((accumulator, field) => {
        accumulator[field.id] = fieldSchema(field);
        return accumulator;
      }, {}),
    },
    ui_schema: {
      sections: [
        {
          id: `${documentType}-legacy`,
          title: documentType.replace(/_/g, " "),
          fields: plannerSchema.fields.map((field) => ({
            path: field.id,
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            widget: field.widget,
          })),
        },
      ],
    },
  };
}
