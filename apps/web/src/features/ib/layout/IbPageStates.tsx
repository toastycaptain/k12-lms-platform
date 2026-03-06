"use client";

import Link from "next/link";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";

function StateCard({
  title,
  description,
  actionHref = IB_CANONICAL_ROUTES.home,
  actionLabel = "Return to IB home",
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      <Link
        href={actionHref}
        className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
      >
        {actionLabel}
      </Link>
    </section>
  );
}

export function IbPageLoading({ title = "Loading IB workspace..." }: { title?: string }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-slate-100" />
      <p className="mt-4 text-sm text-slate-500">{title}</p>
    </section>
  );
}

export function IbPageNotFound({
  description = "The IB record could not be found for this school or route.",
  actionHref,
}: {
  description?: string;
  actionHref?: string;
}) {
  return <StateCard title="Record not found" description={description} actionHref={actionHref} />;
}

export function IbPageForbidden({
  description = "Your current role does not have access to this IB route.",
  actionHref,
}: {
  description?: string;
  actionHref?: string;
}) {
  return <StateCard title="Access restricted" description={description} actionHref={actionHref} />;
}

export function IbSchoolMismatchState() {
  return (
    <StateCard
      title="School mismatch"
      description="This record belongs to a different school than the one currently selected. Switch schools and try the route again."
    />
  );
}

export function IbFeatureDisabledState({ featureFlag }: { featureFlag?: string | null }) {
  return (
    <StateCard
      title="Feature not enabled"
      description={
        featureFlag
          ? `This route is behind ${featureFlag}. Enable it for the current tenant or school before using the page.`
          : "This route is not enabled for the current tenant or school."
      }
    />
  );
}

export function IbArchivedRecordState() {
  return (
    <StateCard
      title="Archived record"
      description="The original record has been archived. Use the fallback route or a server-provided redirect if you need the current location."
    />
  );
}
