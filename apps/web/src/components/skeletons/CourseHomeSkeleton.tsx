"use client";

import { Skeleton } from "@k12/ui";

export function CourseHomeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
        <Skeleton width="w-40" height="h-4" />
        <Skeleton width="w-72" height="h-8" />
        <Skeleton width="w-44" height="h-4" />
        <Skeleton width="w-full" height="h-4" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rectangle" height="h-20" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rectangle" height="h-20" />
        ))}
      </div>
    </div>
  );
}
