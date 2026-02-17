"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const BASE_CLASS =
  "block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1";

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", error = false, ...props },
  ref,
) {
  const colorClass = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  return (
    <select ref={ref} className={`${BASE_CLASS} ${colorClass} ${className}`.trim()} {...props} />
  );
});

export default Select;
