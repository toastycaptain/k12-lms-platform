"use client";

import DocumentEditor from "@/curriculum/documents/DocumentEditor";

export default function PlanDocumentModule({ documentId }: { documentId: number }) {
  return <DocumentEditor documentId={documentId} />;
}
