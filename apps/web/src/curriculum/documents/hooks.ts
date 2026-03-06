import { useMemo } from "react";
import { type SWRConfiguration } from "swr";
import { buildQueryString } from "@/lib/swr";
import { useSchoolSWR } from "@/lib/useSchoolSWR";
import type {
  CurriculumDocument,
  CurriculumDocumentAlignment,
  CurriculumDocumentLink,
  CurriculumDocumentVersion,
  UseCurriculumDocumentsParams,
} from "@/curriculum/documents/types";

export function useCurriculumDocuments(
  params: UseCurriculumDocumentsParams = {},
  config?: SWRConfiguration<CurriculumDocument[]>,
) {
  const query = buildQueryString(params);
  return useSchoolSWR<CurriculumDocument[]>(`/api/v1/curriculum_documents${query}`, config);
}

export function useCurriculumDocument(
  id: number | string | null | undefined,
  config?: SWRConfiguration<CurriculumDocument>,
) {
  return useSchoolSWR<CurriculumDocument>(id ? `/api/v1/curriculum_documents/${id}` : null, config);
}

export function useCurriculumDocumentVersions(
  documentId: number | string | null | undefined,
  config?: SWRConfiguration<CurriculumDocumentVersion[]>,
) {
  return useSchoolSWR<CurriculumDocumentVersion[]>(
    documentId ? `/api/v1/curriculum_documents/${documentId}/versions` : null,
    config,
  );
}

export function useCurriculumDocumentLinks(
  documentId: number | string | null | undefined,
  config?: SWRConfiguration<CurriculumDocumentLink[]>,
) {
  return useSchoolSWR<CurriculumDocumentLink[]>(
    documentId ? `/api/v1/curriculum_documents/${documentId}/links` : null,
    config,
  );
}

export function useCurriculumDocumentAlignments(
  versionId: number | string | null | undefined,
  config?: SWRConfiguration<CurriculumDocumentAlignment[]>,
) {
  const result = useSchoolSWR<Array<Record<string, unknown>>>(
    versionId ? `/api/v1/curriculum_document_versions/${versionId}/alignments` : null,
    config as SWRConfiguration<Array<Record<string, unknown>>>,
  );

  const alignments = useMemo(
    () =>
      (result.data ?? []).map((row) => ({
        id: typeof row.id === "number" ? row.id : undefined,
        standard_id: Number(row.standard_id),
        alignment_type: typeof row.alignment_type === "string" ? row.alignment_type : "aligned",
        metadata:
          row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {},
        standard:
          row.standard && typeof row.standard === "object" && !Array.isArray(row.standard)
            ? {
                id: Number((row.standard as Record<string, unknown>).id),
                standard_framework_id: Number(
                  (row.standard as Record<string, unknown>).standard_framework_id,
                ),
                kind:
                  typeof (row.standard as Record<string, unknown>).kind === "string"
                    ? String((row.standard as Record<string, unknown>).kind)
                    : "standard",
                code:
                  typeof (row.standard as Record<string, unknown>).code === "string"
                    ? String((row.standard as Record<string, unknown>).code)
                    : undefined,
                identifier:
                  typeof (row.standard as Record<string, unknown>).identifier === "string"
                    ? String((row.standard as Record<string, unknown>).identifier)
                    : undefined,
                label:
                  typeof (row.standard as Record<string, unknown>).label === "string"
                    ? String((row.standard as Record<string, unknown>).label)
                    : undefined,
                description:
                  typeof (row.standard as Record<string, unknown>).description === "string"
                    ? String((row.standard as Record<string, unknown>).description)
                    : undefined,
                grade_band:
                  typeof (row.standard as Record<string, unknown>).grade_band === "string"
                    ? String((row.standard as Record<string, unknown>).grade_band)
                    : undefined,
              }
            : undefined,
      })),
    [result.data],
  );

  return {
    ...result,
    data: alignments,
  };
}
