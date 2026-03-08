import { normalizePackSubset } from "@/curriculum/runtime/normalizePackSubset";
import { summarizePackCapabilities } from "@/curriculum/runtime/packCapabilities";

describe("summarizePackCapabilities", () => {
  it("extracts cross-pack capability counts from normalized runtime payloads", () => {
    const runtime = normalizePackSubset({
      key: "ib_continuum_v1",
      version: "2026.2",
      document_types: {
        unit_plan: {
          label: "Unit plan",
          allowed_schema_keys: ["unit"],
          default_schema_key: "unit",
        },
        ib_pyp_unit: {
          label: "PYP unit",
          allowed_schema_keys: ["ib_pyp_unit"],
          default_schema_key: "ib_pyp_unit",
        },
      },
      workflow_bindings: {
        unit_plan: "planner_default",
        ib_pyp_unit: "ib_pyp_unit_workflow",
      },
      report_bindings: {
        pyp_narrative: { audience: "family" },
        conference_packet: { audience: "family" },
      },
      capability_modules: {
        portfolio: { enabled: true },
        family_publishing: { enabled: true },
      },
      integration_hints: {
        lti_context_tag: "science",
        export_target: "sis",
      },
    });

    expect(summarizePackCapabilities(runtime)).toEqual({
      documentTemplateCount: 2,
      workflowTemplateCount: 2,
      reportFamilyCount: 2,
      capabilityModuleKeys: ["family_publishing", "portfolio"],
      integrationHintKeys: ["export_target", "lti_context_tag"],
    });
  });

  it("returns stable empty counts when extraction fields are absent", () => {
    expect(summarizePackCapabilities(normalizePackSubset(null))).toEqual({
      documentTemplateCount: 0,
      workflowTemplateCount: 0,
      reportFamilyCount: 0,
      capabilityModuleKeys: [],
      integrationHintKeys: [],
    });
  });
});
