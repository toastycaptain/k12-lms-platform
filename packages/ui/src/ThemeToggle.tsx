import { SegmentedControl } from "./SegmentedControl";

interface ThemeToggleProps {
  value: "light" | "dark" | "system";
  onChange: (value: "light" | "dark" | "system") => void;
}

export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <SegmentedControl
      label="Theme"
      value={value}
      onChange={(next) => onChange(next as "light" | "dark" | "system")}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ]}
    />
  );
}
