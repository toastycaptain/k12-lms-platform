"use client";

import { Skeleton } from "@k12/ui";

export function QuizSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton width="w-40" height="h-4" />
        <Skeleton width="w-80" height="h-8" />
        <Skeleton width="w-64" height="h-4" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton variant="rectangle" height="h-64" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rectangle" height="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}
