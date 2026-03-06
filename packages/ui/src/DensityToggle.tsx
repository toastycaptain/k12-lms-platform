import { SegmentedControl } from "./SegmentedControl";

interface DensityToggleProps {
  value: "comfortable" | "compact";
  onChange: (value: "comfortable" | "compact") => void;
}

export function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <SegmentedControl
      label="Density"
      value={value}
      onChange={(next) => onChange(next as "comfortable" | "compact")}
      options={[
        { value: "comfortable", label: "Comfortable" },
        { value: "compact", label: "Compact" },
      ]}
    />
  );
}
