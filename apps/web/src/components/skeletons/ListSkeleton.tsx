"use client";

import { Skeleton } from "@k12/ui";

interface ListSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

export function ListSkeleton({ count = 5, showHeader = true }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton width="w-48" height="h-7" />
          <Skeleton width="w-72" height="h-4" />
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="space-y-2 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
          >
            <Skeleton width="w-1/2" height="h-5" />
            <Skeleton width="w-1/3" height="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
