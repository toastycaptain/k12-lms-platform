"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  autoResize?: boolean;
}

const BASE_CLASS =
  "block w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1";

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className = "", error = false, autoResize = false, onInput, ...props },
  ref,
) {
  const colorClass = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  return (
    <textarea
      ref={ref}
      className={`${BASE_CLASS} ${colorClass} ${className}`.trim()}
      onInput={(event) => {
        if (autoResize) {
          event.currentTarget.style.height = "auto";
          event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
        }
        onInput?.(event);
      }}
      {...props}
    />
  );
});

export default TextArea;
