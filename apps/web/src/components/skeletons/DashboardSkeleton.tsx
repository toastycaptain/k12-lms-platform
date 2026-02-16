"use client";

import { Skeleton } from "@/components/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton width="w-72" height="h-8" />
        <Skeleton width="w-96" height="h-4" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width="w-48" height="h-6" />
          <Skeleton width="w-20" height="h-4" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rectangle" height="h-28" />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton width="w-40" height="h-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rectangle" height="h-20" />
          ))}
        </div>
      </section>
    </div>
  );
}
