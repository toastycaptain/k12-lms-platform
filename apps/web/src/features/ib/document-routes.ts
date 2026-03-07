import type { CurriculumDocument } from "@/curriculum/documents/types";

export function isIbDocument(
  document:
    | Pick<CurriculumDocument, "document_type" | "pack_key" | "schema_key">
    | null
    | undefined,
): boolean {
  if (!document) return false;
  return (
    document.pack_key === "ib_continuum_v1" ||
    document.document_type.startsWith("ib_") ||
    document.schema_key.startsWith("ib.")
  );
}

export function canonicalIbHrefForDocument(
  document: Pick<CurriculumDocument, "id" | "document_type" | "schema_key">,
): string | null {
  const schemaKey = document.schema_key || "";
  const documentType = document.document_type || "";

  if (schemaKey.includes("ib.pyp") || documentType.startsWith("ib_pyp")) {
    return `/ib/pyp/units/${document.id}`;
  }
  if (schemaKey.includes("interdisciplinary") || documentType.includes("interdisciplinary")) {
    return `/ib/myp/interdisciplinary/${document.id}`;
  }
  if (schemaKey.includes("service_reflection") || documentType === "ib_myp_service_reflection") {
    return `/ib/myp/service/${document.id}`;
  }
  if (schemaKey.includes("ib.myp.project") || documentType === "ib_myp_project") {
    return `/ib/myp/projects/${document.id}`;
  }
  if (schemaKey.includes("ib.myp") || documentType.startsWith("ib_myp")) {
    return `/ib/myp/units/${document.id}`;
  }
  if (schemaKey.includes("course_map") || documentType === "ib_dp_course_map") {
    return `/ib/dp/course-maps/${document.id}`;
  }
  if (schemaKey.includes("internal_assessment") || documentType === "ib_dp_internal_assessment") {
    return `/ib/dp/internal-assessments/${document.id}`;
  }
  if (schemaKey.includes("extended_essay") || documentType === "ib_dp_extended_essay") {
    return `/ib/dp/ee/${document.id}`;
  }
  if (schemaKey.includes("ib.dp.tok") || documentType === "ib_dp_tok") {
    return `/ib/dp/tok/${document.id}`;
  }
  if (schemaKey.includes("ib.dp.cas") || documentType.startsWith("ib_dp_cas")) {
    return `/ib/dp/cas/records/${document.id}`;
  }
  if (schemaKey.includes("ib.dp") || documentType.startsWith("ib_dp")) {
    return `/ib/dp/course-maps/${document.id}`;
  }

  return null;
}
