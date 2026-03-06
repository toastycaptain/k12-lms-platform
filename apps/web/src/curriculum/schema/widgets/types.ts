import type { JsonSchema } from "@/curriculum/schema/types";

export interface WidgetProps {
  fieldId: string;
  path: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  schema: JsonSchema;
  value: unknown;
  error?: string | null;
  onChange: (nextValue: unknown) => void;
}
