import { FormField, Select } from "@k12/ui";
import type { WidgetProps } from "@/curriculum/schema/widgets/types";

export default function SelectWidget({
  fieldId,
  label,
  description,
  required,
  schema,
  value,
  error,
  onChange,
}: WidgetProps) {
  const options = Array.isArray(schema.enum) ? schema.enum : [];

  return (
    <FormField
      htmlFor={fieldId}
      label={label}
      description={description}
      error={error || undefined}
      required={required}
    >
      <Select
        id={fieldId}
        value={typeof value === "string" ? value : ""}
        error={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={String(option)} value={String(option)}>
            {String(option)}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
