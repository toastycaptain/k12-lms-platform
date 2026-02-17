"use client";

import { Skeleton } from "@k12/ui";

export function GradebookSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton width="w-56" height="h-7" />
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-4 gap-3 border-b border-gray-100 pb-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} width="w-20" height="h-4" />
          ))}
        </div>
        <div className="space-y-3 pt-3">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <Skeleton key={colIndex} width="w-full" height="h-4" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
