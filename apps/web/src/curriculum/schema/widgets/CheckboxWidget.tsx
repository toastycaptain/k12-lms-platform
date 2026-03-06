import { Checkbox } from "@k12/ui";
import type { WidgetProps } from "@/curriculum/schema/widgets/types";

export default function CheckboxWidget({
  fieldId,
  label,
  description,
  value,
  error,
  onChange,
}: WidgetProps) {
  return (
    <Checkbox
      id={fieldId}
      label={label}
      description={description}
      error={error || undefined}
      checked={value === true}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}
