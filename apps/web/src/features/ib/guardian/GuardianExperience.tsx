"use client";

import { useIbGuardianPayload } from "@/features/ib/data";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { CalendarDigest } from "@/features/ib/guardian/CalendarDigest";
import { CurrentUnitWindow } from "@/features/ib/guardian/CurrentUnitWindow";
import { PortfolioHighlights } from "@/features/ib/guardian/PortfolioHighlights";
import { ProgressSummary } from "@/features/ib/guardian/ProgressSummary";
import { FamilyHomeV2 } from "@/features/ib/guardian/FamilyHomeV2";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { TrustPolicyPanel } from "@/features/ib/phase9/Phase9Panels";
import { ReleasedReportsPanel } from "@/features/ib/reports/ReleasedReportsPanel";
import { CommunicationPreferencesPanel } from "@/features/ib/shared/CommunicationPreferencesPanel";

export function GuardianExperience() {
  const { data, mutate } = useIbGuardianPayload();

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const currentUnitWindows = data.currentUnitWindows ?? [];
  const studentOptions = data.studentOptions ?? [];
  const interactions = data.interactions ?? { acknowledgements: [], responses: [] };
  const digestStrategy = data.digestStrategy ?? { urgentCount: 0, cadenceOptions: [] };
  const visibilityPolicy = data.visibilityPolicy ?? { noiseBudget: {} };
  const howToHelp = data.howToHelp ?? [];
  const preferences = data.preferences ?? {};
  const firstUnitWindow = currentUnitWindows[0] || data.currentUnits[0];

  return (
    <IbWorkspaceScaffold
      title="Family home"
      description="Guardian views stay permissioned, understandable, and calm while still showing what matters in IB learning."
      badges={
        <>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
            Family-facing only
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Noise-budgeted
          </span>
        </>
      }
      metrics={[
        {
          label: "Stories this week",
          value: String(data.progressSummary.storyCount),
          detail: "Narrative updates with clear home prompts",
          tone: "success",
        },
        {
          label: "Upcoming milestones",
          value: String(data.calendarDigest.length),
          detail: "Only relevant, family-visible dates",
          tone: "accent",
        },
        {
          label: "Urgent items",
          value: String(digestStrategy.urgentCount),
          detail: "Routine communication remains digest-first",
          tone: digestStrategy.urgentCount > 0 ? "warm" : "success",
        },
        {
          label: "Responses",
          value: String(interactions.responses.length),
          detail: "Moderated family feedback remains visible",
        },
      ]}
      mobileSummary={`${data.stories.length} story update(s), ${data.releasedReports.length} released report(s), and ${digestStrategy.urgentCount} urgent family item(s) are available from mobile.`}
      mobileActions={[
        {
          id: "read-story",
          label: "Read story",
          href: data.stories[0] ? `/ib/families/stories/${data.stories[0].id}` : "/ib/guardian",
          detail: data.stories[0]?.title || "Open the latest family-facing story.",
        },
        {
          id: "released-report",
          label: "Released report",
          href: data.releasedReports[0]?.href || "/ib/reports",
          detail: data.releasedReports[0]?.title || "Read the latest released report.",
        },
        {
          id: "current-unit",
          label: "Current unit",
          href: firstUnitWindow?.href || "/ib/guardian",
          detail: firstUnitWindow?.title || "Open the current unit window.",
        },
      ]}
      main={
        <div className="space-y-5">
          <FamilyHomeV2
            students={studentOptions}
            stories={data.stories}
            howToHelp={howToHelp.map((item) => ({
              id: item.id,
              title: item.title,
              prompt: item.prompt || "Ask a short question about the current learning focus.",
            }))}
            digestStrategy={{
              urgentCount: digestStrategy.urgentCount,
              cadenceOptions: digestStrategy.cadenceOptions,
            }}
            preferences={preferences}
          />

          <div className="grid gap-5 xl:grid-cols-2">
            <CurrentUnitWindow title={firstUnitWindow?.title} summary={firstUnitWindow?.summary} />
            <WorkspacePanel
              title="Upcoming milestones"
              description="Families see the next supportable milestone without internal review clutter."
            >
              <div className="space-y-3">
                {data.milestoneDigest.length > 0 ? (
                  data.milestoneDigest.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="block rounded-3xl bg-slate-50 p-4 text-sm text-slate-700"
                    >
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1">
                        {item.programme} • {item.cadence}
                      </p>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">
                    No family-visible milestones are currently scheduled.
                  </p>
                )}
              </div>
            </WorkspacePanel>
          </div>

          <PortfolioHighlights items={data.portfolioHighlights.map((item) => item.title)} />
        </div>
      }
      aside={
        <div className="space-y-4">
          <ProgressSummary
            items={[
              `${data.progressSummary.storyCount} published stories are visible.`,
              `${data.progressSummary.highlightCount} portfolio highlights are approved.`,
              `${data.progressSummary.supportPrompts} support prompts are available for home conversations.`,
              `Routine digest limit: ${visibilityPolicy.noiseBudget.routine_digest_per_week || 0} per week.`,
            ]}
          />
          <WorkspacePanel
            title="Calendar digest"
            description="Only the dates families need for support, preparation, or celebration."
          >
            <CalendarDigest
              items={data.calendarDigest.map((item) => ({
                id: item.id,
                date: item.publishedAt || null,
                title: item.title,
                detail: item.cadence,
              }))}
            />
          </WorkspacePanel>
          <WorkspacePanel
            title="Family interactions"
            description="Moderated responses and acknowledgements remain visible without turning the feed into chatter."
          >
            <div className="space-y-2 text-sm text-slate-700">
              {[...interactions.acknowledgements, ...interactions.responses].map((item) => (
                <div
                  key={`${item.id}-${item.occurredAt}`}
                  className="rounded-2xl bg-slate-50 px-4 py-4"
                >
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </WorkspacePanel>
          <ReleasedReportsPanel
            title="Released reports"
            description="Read-state and acknowledgement stay attached to the same report history the school released."
            reports={data.releasedReports}
            receipts={data.deliveryReceipts}
            emptyDescription="Released report history will appear here when teachers or coordinators publish it for families."
            onRefresh={() => mutate()}
          />
          <TrustPolicyPanel audience="guardian" />
          <CommunicationPreferencesPanel
            audience="guardian"
            fallback={data.communicationPreferences}
            title="Communication preferences"
            description="Quiet hours and digest cadence stay explicit so family communication remains calm."
            onSaved={() => mutate()}
          />
        </div>
      }
    />
  );
}
