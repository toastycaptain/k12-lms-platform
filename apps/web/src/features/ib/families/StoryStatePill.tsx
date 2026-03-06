import { IbTonePill } from "@/features/ib/core/IbSurfaceState";

export type StoryState =
  | "draft"
  | "needs-context"
  | "ready-for-digest"
  | "publish-now"
  | "scheduled"
  | "published"
  | "held";

const STATE_TONES: Record<StoryState, "default" | "accent" | "warm" | "success" | "risk"> = {
  draft: "default",
  "needs-context": "warm",
  "ready-for-digest": "success",
  "publish-now": "accent",
  scheduled: "accent",
  published: "success",
  held: "risk",
};

export function StoryStatePill({ state }: { state: StoryState }) {
  return <IbTonePill label={state.replace(/-/g, " ")} tone={STATE_TONES[state]} />;
}
