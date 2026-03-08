import type {
  CurriculumPackV1,
  LegacyPlannerField,
  LegacyPlannerObjectSchema,
  PackDocumentSchema,
  PackDocumentSchemaIndexEntry,
  PackDocumentType,
  PackFrameworkBindings,
  PackCapabilityMap,
  PackRuntimeSubset,
  PackWorkflowDefinition,
} from "@/curriculum/runtime/types";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function normalizePlannerFields(value: unknown): LegacyPlannerField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fields: LegacyPlannerField[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return;
    }

    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || row.id.length === 0) {
      return;
    }

    fields.push({
      id: row.id,
      label: typeof row.label === "string" ? row.label : undefined,
      description: typeof row.description === "string" ? row.description : undefined,
      placeholder: typeof row.placeholder === "string" ? row.placeholder : undefined,
      type: typeof row.type === "string" ? row.type : undefined,
      widget: typeof row.widget === "string" ? row.widget : undefined,
      options: toStringArray(row.options),
      multiline: row.multiline === true,
      required: row.required === true,
    });
  });

  return fields;
}

function normalizePlannerSchemas(value: unknown): Record<string, LegacyPlannerObjectSchema> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, LegacyPlannerObjectSchema>
  >((accumulator, [key, entry]) => {
    const row =
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? (entry as Record<string, unknown>)
        : {};

    accumulator[key] = {
      fields: normalizePlannerFields(row.fields),
      defaults:
        row.defaults && typeof row.defaults === "object" && !Array.isArray(row.defaults)
          ? (row.defaults as Record<string, unknown>)
          : {},
    };
    return accumulator;
  }, {});
}

function normalizeDocumentTypes(value: unknown): Record<string, PackDocumentType> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, PackDocumentType>>(
    (accumulator, [key, entry]) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return accumulator;
      }

      const row = entry as Record<string, unknown>;
      accumulator[key] = {
        label: typeof row.label === "string" ? row.label : key,
        allowed_schema_keys: toStringArray(row.allowed_schema_keys),
        default_schema_key:
          typeof row.default_schema_key === "string" ? row.default_schema_key : "",
        allowed_statuses: toStringArray(row.allowed_statuses),
        default_status: typeof row.default_status === "string" ? row.default_status : undefined,
        relationships:
          row.relationships &&
          typeof row.relationships === "object" &&
          !Array.isArray(row.relationships)
            ? (row.relationships as Record<
                string,
                NonNullable<PackDocumentType["relationships"]>[string]
              >)
            : {},
      };
      return accumulator;
    },
    {},
  );
}

function normalizeDocumentSchemas(value: unknown): Record<string, PackDocumentSchema> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, PackDocumentSchema>
  >((accumulator, [key, entry]) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return accumulator;
    }

    const row = entry as Record<string, unknown>;
    accumulator[key] = {
      document_type: typeof row.document_type === "string" ? row.document_type : "",
      label: typeof row.label === "string" ? row.label : undefined,
      data_schema:
        row.data_schema && typeof row.data_schema === "object" && !Array.isArray(row.data_schema)
          ? (row.data_schema as Record<string, unknown>)
          : {},
      ui_schema:
        row.ui_schema && typeof row.ui_schema === "object" && !Array.isArray(row.ui_schema)
          ? (row.ui_schema as Record<string, unknown>)
          : undefined,
    };
    return accumulator;
  }, {});
}

function normalizeDocumentSchemaIndex(
  value: unknown,
): Record<string, PackDocumentSchemaIndexEntry> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, PackDocumentSchemaIndexEntry>
  >((accumulator, [key, entry]) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return accumulator;
    }

    const row = entry as Record<string, unknown>;
    accumulator[key] = {
      default_schema_key:
        typeof row.default_schema_key === "string" ? row.default_schema_key : undefined,
      allowed_schema_keys: toStringArray(row.allowed_schema_keys),
      allowed_statuses: toStringArray(row.allowed_statuses),
      relationships:
        row.relationships &&
        typeof row.relationships === "object" &&
        !Array.isArray(row.relationships)
          ? (row.relationships as Record<
              string,
              NonNullable<PackDocumentSchemaIndexEntry["relationships"]>[string]
            >)
          : {},
      schemas: Array.isArray(row.schemas)
        ? row.schemas.reduce<NonNullable<PackDocumentSchemaIndexEntry["schemas"]>>(
            (schemas, schema) => {
              if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
                return schemas;
              }

              const schemaRow = schema as Record<string, unknown>;
              if (typeof schemaRow.schema_key !== "string") {
                return schemas;
              }

              schemas.push({
                schema_key: schemaRow.schema_key,
                label: typeof schemaRow.label === "string" ? schemaRow.label : undefined,
                document_type:
                  typeof schemaRow.document_type === "string" ? schemaRow.document_type : undefined,
              });
              return schemas;
            },
            [],
          )
        : [],
    };
    return accumulator;
  }, {});
}

function normalizeWorkflowDefinitions(value: unknown): Record<string, PackWorkflowDefinition> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, PackWorkflowDefinition>;
}

function normalizeFrameworkBindings(value: unknown): PackFrameworkBindings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const row = value as Record<string, unknown>;
  return {
    defaults: toStringArray(row.defaults),
    allowed: toStringArray(row.allowed),
    node_kinds: toStringArray(row.node_kinds),
  };
}

function normalizeCapabilityMap(value: unknown): PackCapabilityMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as PackCapabilityMap;
}

export function normalizePackSubset(
  input?: CurriculumPackV1 | Record<string, unknown> | null,
): PackRuntimeSubset {
  const payload = (input ?? {}) as CurriculumPackV1 & Record<string, unknown>;

  return {
    packKey:
      (typeof payload.pack_key === "string" && payload.pack_key) ||
      payload.identity?.key ||
      (typeof payload.key === "string" ? payload.key : null),
    packVersion:
      (typeof payload.pack_version === "string" && payload.pack_version) ||
      payload.versioning?.version ||
      (typeof payload.version === "string" ? payload.version : null),
    terminology:
      payload.terminology &&
      typeof payload.terminology === "object" &&
      !Array.isArray(payload.terminology)
        ? (payload.terminology as Record<string, string>)
        : {},
    plannerObjectSchemas: normalizePlannerSchemas(payload.planner_object_schemas),
    documentTypes: normalizeDocumentTypes(payload.document_types),
    documentSchemas: normalizeDocumentSchemas(payload.document_schemas),
    documentSchemaIndex: normalizeDocumentSchemaIndex(payload.document_schema_index),
    workflowBindings:
      payload.workflow_bindings &&
      typeof payload.workflow_bindings === "object" &&
      !Array.isArray(payload.workflow_bindings)
        ? (payload.workflow_bindings as Record<string, string>)
        : {},
    workflowDefinitions: normalizeWorkflowDefinitions(payload.workflow_definitions),
    frameworkBindings: normalizeFrameworkBindings(payload.framework_bindings),
    reportBindings: normalizeCapabilityMap(payload.report_bindings),
    capabilityModules: normalizeCapabilityMap(payload.capability_modules),
    integrationHints: normalizeCapabilityMap(payload.integration_hints),
  };
}
