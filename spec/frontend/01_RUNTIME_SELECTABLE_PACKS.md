# Step 1 — Runtime-selectable curriculum packs (Frontend)

## Outcome

After this step:

- The UI treats “curriculum profiles” as **runtime-selectable curriculum packs**.
- Admins can view **available packs** (system + tenant releases) and select defaults/overrides without requiring a deploy.
- The authenticated user session (`/api/v1/me`) exposes runtime pack metadata that the UI can consume.
- The **left navigation** is built from a **registry + pack runtime configuration** (not hard-coded arrays).
- The UI remains backwards compatible with the current API payloads (legacy profile fields).

This step does **not** build the schema-driven planner editor yet; it lays the foundation for pack-driven UI composition.

---

## Why the current frontend needs this

Currently:

- `AppShell.tsx` uses a **static `NAV_ITEMS` array** and only filters it.
- Curriculum runtime impacts only a few labels (`unit_label`) and a shallow top-level filter (`visible_navigation`).
- The admin “Curriculum Profiles” page assumes **filesystem profiles** and does not fully reflect **tenant pack releases**.

Route 3 requires the UI to be shaped by packs at runtime:

- navigation structure per role
- module/page visibility
- terminology across the app

---

## Key design decisions

### Decision 1 — Use registries, not arbitrary pack-provided routes/components
Packs can only reference:

- `nav_item_id`s defined in a **Navigation Registry**
- `module_id`s defined in a **Module Registry** (used in later steps)

The UI ignores unknown IDs.

### Decision 2 — Keep URLs stable during migration
- Keep `/admin/curriculum-profiles` route, but label it “Curriculum Packs”.
- Keep reading `curriculum_runtime.profile_key/profile_version` for now; add adapters for new pack keys.

### Decision 3 — Backwards compatible payload parsing
The backend (Step 1) may introduce `available_packs` while keeping `available_profiles` / `available_profile_keys`.

Frontend must:

- Prefer new `available_packs` if present
- Fall back to old fields

---

## Implementation plan

### 1) Add pack runtime and pack list types

**Modify:** `apps/web/src/lib/api.ts`

Update `CurrentUser.curriculum_runtime` typing to accept new metadata fields that backend Step 1 adds.

Add optional fields:

```ts
curriculum_runtime?: {
  profile_key?: string;
  profile_version?: string;
  // New names (future):
  pack_key?: string;
  pack_version?: string;

  selected_from?: string;
  terminology?: Record<string, string>;
  navigation?: Record<string, string[]>;
  visible_navigation?: string[];

  // New debugging metadata:
  pack_payload_source?: "tenant_release" | "system" | "fallback";
  pack_release_id?: number;
};
```

**Important:** Keep the legacy fields (`profile_key/profile_version`) because existing backend returns those today.

---

### 2) Create runtime adapters (profile → pack)

**Create:** `apps/web/src/curriculum/runtime/adapters.ts`

Purpose:

- Normalize runtime objects so the rest of the UI can use `pack_key/pack_version` consistently.

Example:

```ts
export interface NormalizedPackRuntime {
  packKey: string | null;
  packVersion: string | null;
  selectedFrom: string | null;
  terminology: Record<string, string>;
  visibleNavigation: string[];
  navigationByRole: Record<string, string[]>;
  payloadSource: string | null;
  releaseId: number | null;
}

export function normalizePackRuntime(input: any): NormalizedPackRuntime {
  const runtime = input ?? {};
  const packKey = runtime.pack_key ?? runtime.profile_key ?? null;
  const packVersion = runtime.pack_version ?? runtime.profile_version ?? null;

  return {
    packKey,
    packVersion,
    selectedFrom: runtime.selected_from ?? null,
    terminology: runtime.terminology ?? {},
    visibleNavigation: Array.isArray(runtime.visible_navigation) ? runtime.visible_navigation : [],
    navigationByRole: runtime.navigation ?? {},
    payloadSource: runtime.pack_payload_source ?? null,
    releaseId: typeof runtime.pack_release_id === "number" ? runtime.pack_release_id : null,
  };
}
```

---

### 3) Add a `useCurriculumRuntime()` hook

**Create:** `apps/web/src/curriculum/runtime/useCurriculumRuntime.ts`

This hook should:

- read the authenticated user from `useAuth()`
- normalize runtime pack metadata using `normalizePackRuntime`

```ts
import { useAuth } from "@/lib/auth-context";
import { normalizePackRuntime } from "./adapters";

export function useCurriculumRuntime() {
  const { user } = useAuth();
  const runtime = normalizePackRuntime(user?.curriculum_runtime);
  return { runtime, roles: user?.roles ?? [] };
}
```

This becomes the **single entry point** for runtime pack decisions inside UI.

---

### 4) Build a Navigation Registry

**Create:** `apps/web/src/curriculum/navigation/registry.ts`

Define a map of stable nav item IDs to actual route config.

Rules:

- IDs are stable across packs.
- IDs do not embed labels (labels can be overridden by pack terminology).
- Registry is the only source of `href` and base label.

Example:

```ts
export type NavItemId =
  | "guardian"
  | "learn"
  | "plan"
  | "teach"
  | "assess"
  | "admin"
  | "district"
  | "report"
  | "communicate";

export interface NavRegistryItem {
  id: NavItemId;
  label: string;
  href: string;
  roles?: string[];
  children?: { id: string; label: string; href: string; roles?: string[] }[];
}

export const NAV_REGISTRY: Record<string, NavRegistryItem> = {
  plan: {
    id: "plan",
    label: "Plan",
    href: "/plan",
    roles: ["admin", "curriculum_lead", "teacher"],
    children: [
      { id: "plan.units", label: "Units", href: "/plan/units" },
      { id: "plan.calendar", label: "Calendar", href: "/plan/calendar" },
      { id: "plan.templates", label: "Templates", href: "/plan/templates" },
      { id: "plan.standards", label: "Standards", href: "/plan/standards" },
    ],
  },
  // ... mirror the current NAV_ITEMS array here
};
```

Do **not** remove current routes yet; just centralize their definition.

---

### 5) Implement `buildNav()` from runtime

**Create:** `apps/web/src/curriculum/navigation/buildNav.ts`

Responsibilities:

- Apply role filtering
- Apply runtime `visible_navigation` filtering
- Apply special student/guardian-only rules that `AppShell` currently enforces
- Apply pack terminology overrides (pluralization)

Signature:

```ts
import { NAV_REGISTRY, type NavRegistryItem } from "./registry";
import type { NormalizedPackRuntime } from "../runtime/adapters";

export function buildNav(
  registry: Record<string, NavRegistryItem>,
  runtime: NormalizedPackRuntime,
  roles: string[],
): NavRegistryItem[] {
  // return ordered list
}
```

Implementation notes:

- If `runtime.visibleNavigation.length > 0`, treat it as the ordered list of top-level IDs.
- Otherwise fallback to a default ordered list: `Object.values(NAV_REGISTRY)` sorted by a hard-coded “default order”.
- Ignore unknown IDs.

Terminology:

- Apply `runtime.terminology.unit_label` to the “Units” child label.
- Keep pluralization logic, but move it into a shared helper (`pluralize`).

Guardian/student rules:

- Keep existing logic: guardian-only sees `guardian` + `communicate`.
- student-only sees `learn` + `communicate`.

---

### 6) Refactor `AppShell` to use registries

**Modify:** `apps/web/src/components/AppShell.tsx`

Replace:

- static `NAV_ITEMS`

with:

- `NAV_REGISTRY`
- `buildNav()`

High-level diff:

1. Import and call `useCurriculumRuntime()`.
2. Compute `visibleNavItems = buildNav(NAV_REGISTRY, runtime, roles)`.
3. Render `visibleNavItems` exactly as before.

Keep flyout behavior and rendering unchanged.

Backwards compatibility:

- If runtime pack has no nav restrictions, UI renders default nav.

---

### 7) Update `AppShell` tests

**Modify:** `apps/web/src/components/AppShell.test.tsx`

Because `AppShell` now depends on runtime normalization:

- Ensure `createMockUser()` in tests includes a default `curriculum_runtime` with empty fields or leave it undefined.

Add new test cases:

1. **Runtime nav filtering:** if `visible_navigation = ["plan","communicate"]`, only those appear.
2. **Terminology pluralization:** if `unit_label = "Inquiry"`, Plan children show “Inquirys” (or add special plural rules).
   - If you want correct plural, implement pluralizer that handles `y → ies`.

Update existing tests to work with registry-based nav.

---

### 8) Update Admin “Curriculum Profiles” page to support `available_packs`

**Modify:** `apps/web/src/app/admin/curriculum-profiles/page.tsx`

#### 8.1) Update response typing
Add support for:

```ts
interface AvailablePack {
  key: string;
  version: string;
  label: string;
  source: "tenant_release" | "system";
  release_status?: string | null;
  pack_status?: "active" | "deprecated";
}

interface CurriculumSettingsResponse {
  available_packs?: AvailablePack[];
  // keep existing fields for fallback
}
```

#### 8.2) Pack list fallback logic
When rendering available choices:

- Prefer `settings.available_packs`.
- Else derive from `profiles` (legacy `/api/v1/curriculum_profiles`).

#### 8.3) UI label updates
Change page title from “Curriculum Profiles” to “Curriculum Packs”.

Leave the route unchanged.

#### 8.4) Display pack source/status
In the selector options and/or a side panel, show:

- pack key
- version
- source (system vs tenant release)
- release status (published/frozen/etc)

This is essential when a tenant overrides a system pack.

---

## API expectations (backend)

Frontend expects the backend Step 1 changes:

- `/api/v1/me` includes runtime metadata (pack payload source etc).
- `/api/v1/admin/curriculum_settings` includes `available_packs` (preferred) plus legacy fields.

If `available_packs` is missing, the UI must still work.

---

## Acceptance criteria

- AppShell nav renders correctly for teacher/admin/student/guardian roles.
- When `visible_navigation` is present, only those sections render.
- Admin pack selection screen clearly shows pack version + source.
- No routes break; `/plan/units` etc still work.

---

## Rollout notes

- Ship this step behind a small feature flag if desired (`NEXT_PUBLIC_PACK_NAV_V1=1`) and keep the old behavior as fallback.
- Once stable, remove the old static `NAV_ITEMS` array.
