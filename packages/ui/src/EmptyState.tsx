"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008h-.008V15zm-3 0h.008v.008H9.75V15zm0-3h.008v.008H9.75V12zm3 0h.008v.008h-.008V12zM6.75 19.5h10.5A2.25 2.25 0 0019.5 17.25V6.75A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5z"
      />
    </svg>
  );

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center">
      {icon || defaultIcon}
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {actionLabel && (onAction || actionHref) ? (
        actionHref ? (
          <a
            href={actionHref}
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {actionLabel}
          </a>
        ) : (
          <button
            onClick={onAction}
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {actionLabel}
          </button>
        )
      ) : null}
    </div>
  );
}
