"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const BASE_CLASS =
  "block w-full rounded-md border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1";

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className = "", error = false, ...props },
  ref,
) {
  const colorClass = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  return (
    <input ref={ref} className={`${BASE_CLASS} ${colorClass} ${className}`.trim()} {...props} />
  );
});

export default TextInput;
