import type { PackCapabilityMap, PackRuntimeSubset } from "@/curriculum/runtime/types";

interface PackCapabilityInput {
  documentTypes?: PackRuntimeSubset["documentTypes"];
  workflowBindings?: PackRuntimeSubset["workflowBindings"];
  reportBindings?: PackCapabilityMap;
  capabilityModules?: PackCapabilityMap;
  integrationHints?: PackCapabilityMap;
}

export interface PackCapabilitySummary {
  documentTemplateCount: number;
  workflowTemplateCount: number;
  reportFamilyCount: number;
  capabilityModuleKeys: string[];
  integrationHintKeys: string[];
}

function keysForRecord(value: PackCapabilityMap | undefined): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.keys(value).sort();
}

export function summarizePackCapabilities(
  runtime: PackCapabilityInput | null | undefined,
): PackCapabilitySummary {
  return {
    documentTemplateCount: Object.keys(runtime?.documentTypes || {}).length,
    workflowTemplateCount: Object.keys(runtime?.workflowBindings || {}).length,
    reportFamilyCount: Object.keys(runtime?.reportBindings || {}).length,
    capabilityModuleKeys: keysForRecord(runtime?.capabilityModules),
    integrationHintKeys: keysForRecord(runtime?.integrationHints),
  };
}
