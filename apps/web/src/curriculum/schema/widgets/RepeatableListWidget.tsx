import { Button, FormField, TextInput } from "@k12/ui";
import type { WidgetProps } from "@/curriculum/schema/widgets/types";

export default function RepeatableListWidget({
  fieldId,
  label,
  description,
  placeholder,
  required,
  value,
  error,
  onChange,
}: WidgetProps) {
  const items = Array.isArray(value) ? value.map((item) => String(item ?? "")) : [];

  function updateItem(index: number, nextValue: string): void {
    const nextItems = [...items];
    nextItems[index] = nextValue;
    onChange(nextItems);
  }

  function addItem(): void {
    onChange([...items, ""]);
  }

  function removeItem(index: number): void {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <FormField
      htmlFor={fieldId}
      label={label}
      description={description}
      error={error || undefined}
      required={required}
    >
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${fieldId}-${index}`} className="flex gap-2">
            <TextInput
              id={`${fieldId}-${index}`}
              value={item}
              placeholder={placeholder}
              onChange={(event) => updateItem(index, event.target.value)}
            />
            <Button variant="secondary" onClick={() => removeItem(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button variant="secondary" onClick={addItem}>
          Add item
        </Button>
      </div>
    </FormField>
  );
}
