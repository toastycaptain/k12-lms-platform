"use client";

interface RadioOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  legend: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export default function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  required = false,
}: RadioGroupProps) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <fieldset className="space-y-2" aria-describedby={errorId}>
      <legend className="text-sm font-medium text-gray-700">
        {legend}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </legend>

      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-2 text-sm text-gray-700"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(event) => onChange(event.target.value)}
              disabled={option.disabled}
              className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              <span className="block">{option.label}</span>
              {option.description && (
                <span className="block text-xs text-gray-500">{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
