"use client";

import { Skeleton } from "@k12/ui";

export function StandardsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <Skeleton width="w-36" height="h-5" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} width="w-full" height="h-4" />
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <Skeleton width="w-48" height="h-6" />
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className={index % 2 === 0 ? "pl-0" : "pl-6"}>
            <Skeleton width="w-full" height="h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
