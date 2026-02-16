"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface LtiResourceLink {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  course_id: number | null;
}

export default function LtiToolLaunchPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [resourceLink, setResourceLink] = useState<LtiResourceLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResourceLink() {
      try {
        const record = await apiFetch<LtiResourceLink>(`/api/v1/lti_resource_links/${linkId}`);
        setResourceLink(record);
        setIframeLoading(true);
      } catch {
        setError("Unable to load LTI resource link.");
      } finally {
        setLoading(false);
      }
    }

    void loadResourceLink();
  }, [linkId]);

  const backHref = useMemo(() => {
    if (!resourceLink?.course_id) return "/dashboard";
    return `/teach/courses/${resourceLink.course_id}`;
  }, [resourceLink?.course_id]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LTI Tool Launch</h1>
              <p className="text-sm text-gray-600">Launching external tool content.</p>
            </div>
            <Link href={backHref} className="text-sm text-blue-700 hover:text-blue-800">
              Back to Course
            </Link>
          </div>

          {loading && <p className="text-sm text-gray-500">Launching...</p>}
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {!loading && resourceLink && (
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{resourceLink.title}</h2>
                  <p className="text-sm text-gray-600">{resourceLink.description || "No description provided."}</p>
                </div>
                {resourceLink.url && (
                  <a
                    href={resourceLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Open in New Tab
                  </a>
                )}
              </div>

              {!resourceLink.url && <p className="text-sm text-gray-500">No launch URL configured for this link.</p>}

              {resourceLink.url && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Launching...</p>
                  {iframeLoading && <p className="text-xs text-gray-500">Loading tool content...</p>}
                  <iframe
                    src={resourceLink.url}
                    title={resourceLink.title}
                    className="h-[70vh] w-full rounded border border-gray-200"
                    onLoad={() => setIframeLoading(false)}
                    allow="clipboard-write; fullscreen"
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
