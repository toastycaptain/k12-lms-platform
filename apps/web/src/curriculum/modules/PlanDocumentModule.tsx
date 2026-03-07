"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DocumentEditor from "@/curriculum/documents/DocumentEditor";
import { useCurriculumDocument } from "@/curriculum/documents/hooks";
import { canonicalIbHrefForDocument, isIbDocument } from "@/features/ib/document-routes";

export default function PlanDocumentModule({ documentId }: { documentId: number }) {
  const router = useRouter();
  const { data: document } = useCurriculumDocument(documentId);

  useEffect(() => {
    if (!document || !isIbDocument(document)) return;
    const nextHref = canonicalIbHrefForDocument(document);
    if (nextHref) {
      router.replace(nextHref);
    }
  }, [document, router]);

  return <DocumentEditor documentId={documentId} />;
}
