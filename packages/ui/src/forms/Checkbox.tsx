"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, error, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const controlId = id || `checkbox-${generatedId}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className="space-y-1">
      <label
        htmlFor={controlId}
        className="flex cursor-pointer items-start gap-2 text-sm text-gray-700"
      >
        <input
          ref={ref}
          id={controlId}
          type="checkbox"
          className={`mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`.trim()}
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <span>{label}</span>
      </label>
      {description && (
        <p id={descriptionId} className="pl-6 text-xs text-gray-500">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="pl-6 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Checkbox;
