import { FormField, TextArea } from "@k12/ui";
import type { WidgetProps } from "@/curriculum/schema/widgets/types";

export default function TextAreaWidget({
  fieldId,
  label,
  description,
  placeholder,
  required,
  value,
  error,
  onChange,
}: WidgetProps) {
  return (
    <FormField
      htmlFor={fieldId}
      label={label}
      description={description}
      error={error || undefined}
      required={required}
    >
      <TextArea
        id={fieldId}
        rows={4}
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        placeholder={placeholder}
        error={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
