"use client";

import { useMemo, useState } from "react";
import { inferWidget } from "@/curriculum/schema/inferWidget";
import { getAtPath, setAtPath } from "@/curriculum/schema/paths";
import { resolveSubschema } from "@/curriculum/schema/resolveSubschema";
import type {
  DocumentSchemaDefinition,
  JsonSchema,
  UiFieldSpec,
  UiSchemaSection,
} from "@/curriculum/schema/types";
import { isFieldVisible } from "@/curriculum/schema/visibility";
import { WIDGET_REGISTRY } from "@/curriculum/schema/widgets/registry";

interface SchemaRendererProps {
  definition: DocumentSchemaDefinition;
  value: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (nextValue: Record<string, unknown>) => void;
}

function titleize(value: string): string {
  return value
    .split(".")
    .slice(-1)[0]
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeFieldSpec(field: string | UiFieldSpec): UiFieldSpec {
  return typeof field === "string" ? { path: field } : field;
}

function buildFallbackSections(schema: JsonSchema): UiSchemaSection[] {
  if (!schema.properties || typeof schema.properties !== "object") {
    return [];
  }

  return [
    {
      id: "main",
      title: "Details",
      fields: Object.keys(schema.properties as Record<string, unknown>),
    },
  ];
}

function isRequiredField(schema: JsonSchema, path: string): boolean {
  const parts = path.split(".");
  let current: JsonSchema | null = schema;
  let required = false;

  parts.forEach((segment) => {
    if (!current) {
      return;
    }

    if (current.type === "object" && current.properties && typeof current.properties === "object") {
      required = Array.isArray(current.required) && current.required.includes(segment);
      current = (current.properties as Record<string, JsonSchema>)[segment] ?? null;
      return;
    }

    if (current.type === "array" && current.items && typeof current.items === "object") {
      current = current.items as JsonSchema;
    }
  });

  return required;
}

export default function SchemaRenderer({
  definition,
  value,
  errors = {},
  onChange,
}: SchemaRendererProps) {
  const [activeTab, setActiveTab] = useState(0);

  const sections = useMemo(() => {
    const uiSections = definition.ui_schema.sections?.length
      ? definition.ui_schema.sections
      : buildFallbackSections(definition.data_schema);

    return uiSections;
  }, [definition.data_schema, definition.ui_schema.sections]);

  const visibleSections = sections
    .map((section) => {
      const fields = section.fields
        .map(normalizeFieldSpec)
        .filter((field) => isFieldVisible(field, value));
      return {
        ...section,
        fields,
      };
    })
    .filter((section) => section.fields.length > 0);

  const layout = definition.ui_schema.layout || "sections";
  const renderedSections =
    layout === "tabs" ? visibleSections.slice(activeTab, activeTab + 1) : visibleSections;

  return (
    <div className="space-y-4">
      {layout === "tabs" && visibleSections.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Document sections">
          {visibleSections.map((section, index) => (
            <button
              key={section.id || section.title || index}
              type="button"
              role="tab"
              aria-selected={index === activeTab}
              className={`rounded-full px-3 py-1.5 text-sm ${
                index === activeTab ? "bg-blue-600 text-white" : "bg-white text-gray-600"
              }`}
              onClick={() => setActiveTab(index)}
            >
              {section.title || `Section ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {renderedSections.map((section, sectionIndex) => (
        <section
          key={section.id || section.title || sectionIndex}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          {(section.title || section.description) && (
            <div className="mb-4">
              {section.title && (
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              )}
              {section.description && (
                <p className="text-sm text-gray-600">{section.description}</p>
              )}
            </div>
          )}
          <div className="space-y-4">
            {section.fields.map((field) => {
              const fieldSpec = normalizeFieldSpec(field);
              const subschema = resolveSubschema(definition.data_schema, fieldSpec.path);
              if (!subschema) {
                return null;
              }

              const widgetKey = inferWidget(subschema, fieldSpec);
              const Widget =
                WIDGET_REGISTRY[widgetKey as keyof typeof WIDGET_REGISTRY] || WIDGET_REGISTRY.text;
              const fieldId = `schema-field-${fieldSpec.path.replace(/\./g, "-")}`;
              const label =
                fieldSpec.label ||
                (typeof subschema.title === "string" ? subschema.title : titleize(fieldSpec.path));

              return (
                <Widget
                  key={fieldSpec.path}
                  fieldId={fieldId}
                  path={fieldSpec.path}
                  label={label}
                  description={
                    fieldSpec.description ||
                    (typeof subschema.description === "string" ? subschema.description : undefined)
                  }
                  placeholder={fieldSpec.placeholder}
                  required={isRequiredField(definition.data_schema, fieldSpec.path)}
                  schema={subschema}
                  value={getAtPath(value, fieldSpec.path)}
                  error={errors[fieldSpec.path] || null}
                  onChange={(nextValue) =>
                    onChange(setAtPath(value, fieldSpec.path, nextValue) as Record<string, unknown>)
                  }
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
