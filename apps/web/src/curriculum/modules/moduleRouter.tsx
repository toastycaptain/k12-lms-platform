"use client";

import { EmptyState } from "@k12/ui";
import { MODULE_REGISTRY } from "@/curriculum/modules/registry";

export function ModuleRouter({ moduleId }: { moduleId: string }) {
  const Module = MODULE_REGISTRY[moduleId as keyof typeof MODULE_REGISTRY];

  if (!Module) {
    return (
      <EmptyState
        title="Module unavailable"
        description={`The module '${moduleId}' is not registered in this build.`}
      />
    );
  }

  return <Module />;
}
