"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  error,
  description,
  required = false,
  children,
}: FormFieldProps) {
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  let fieldControl = children;
  if (isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    const existingDescribedBy =
      typeof child.props["aria-describedby"] === "string" ? child.props["aria-describedby"] : "";
    const describedBy = [existingDescribedBy, descriptionId, errorId].filter(Boolean).join(" ");

    fieldControl = cloneElement(child, {
      id: (child.props.id as string | undefined) || htmlFor,
      "aria-describedby": describedBy || undefined,
      "aria-invalid":
        error !== undefined && error.length > 0
          ? true
          : (child.props["aria-invalid"] as boolean | undefined),
    });
  }

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className={[
          "block text-sm font-medium text-gray-700",
          required ? "after:ml-1 after:text-red-600 after:content-['*']" : "",
        ]
          .join(" ")
          .trim()}
      >
        {label}
      </label>

      {description && (
        <p id={descriptionId} className="text-xs text-gray-500">
          {description}
        </p>
      )}

      {fieldControl}

      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
