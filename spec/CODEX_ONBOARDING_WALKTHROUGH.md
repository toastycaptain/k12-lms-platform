# CODEX_ONBOARDING_WALKTHROUGH — Guided First-Time Teacher Onboarding

**Priority:** P2
**Effort:** Small (3–4 hours)
**Spec Refs:** PRD-8 (MVP Success Metrics — time-to-first-unit < 20 min), PRD-5 (Teacher Problems — plan without friction), UX-3.3 (Auth & Onboarding — first-time setup)
**Depends on:** None

---

## Problem

PRD-8 sets a target of "time-to-first-unit < 20 minutes." A setup wizard exists at `/setup` for initial school configuration, but there is no guided onboarding for teachers after their first login. Teachers land on an empty dashboard with no guidance on what to do next:

1. **No welcome flow** — first-time teachers see an empty dashboard with nav items but no direction
2. **No guided walkthrough** — no step-by-step introduction to Plan → Create Unit → Add Standards → Publish
3. **No sample content** — no starter templates or example units to learn from
4. **No progress tracking** — no checklist showing onboarding completion status
5. **No contextual tips** — no tooltip hints on key UI elements during first session

UX-3.3 specifies "first-time setup" but the current implementation only covers admin school setup, not the individual teacher experience.

---

## Tasks

### 1. Track Onboarding State

Add to the Rails user model:

Create migration:
```ruby
class AddOnboardingToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :onboarding_completed_at, :datetime
    add_column :users, :onboarding_step, :string, default: "welcome"
  end
end
```

Add endpoint to `apps/core/app/controllers/api/v1/users_controller.rb`:
```ruby
# PATCH /api/v1/me/onboarding
def update_onboarding
  Current.user.update!(
    onboarding_step: params[:step],
    onboarding_completed_at: params[:step] == "completed" ? Time.current : nil,
  )
  render json: { step: Current.user.onboarding_step }
end
```

### 2. Create Onboarding Checklist Component

Create `apps/web/src/components/OnboardingChecklist.tsx`:

```typescript
interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}

const TEACHER_STEPS: OnboardingStep[] = [
  {
    id: "explore_dashboard",
    label: "Explore your dashboard",
    description: "See your courses, upcoming deadlines, and quick actions.",
    href: "/dashboard",
    completed: false,
  },
  {
    id: "create_first_unit",
    label: "Create your first unit plan",
    description: "Start planning a unit with objectives, standards, and lessons.",
    href: "/plan/units?action=new",
    completed: false,
  },
  {
    id: "align_standards",
    label: "Align to standards",
    description: "Browse and attach curriculum standards to your unit.",
    href: "/plan/standards",
    completed: false,
  },
  {
    id: "try_ai_assistant",
    label: "Try the AI assistant",
    description: "Generate lesson ideas, differentiate activities, or create assessments.",
    href: "/plan/units?highlight=ai",
    completed: false,
  },
  {
    id: "publish_unit",
    label: "Publish a unit",
    description: "Make your unit plan available for delivery.",
    href: "/plan/units",
    completed: false,
  },
];
```

Features:
- Shows as a card on the dashboard when `onboarding_completed_at` is null
- Each step has a checkbox, label, description, and link
- Steps auto-complete based on user actions (API checks)
- "Skip onboarding" link at the bottom
- Dismissible after completion or skip
- Progress bar showing X of 5 steps complete

### 3. Create Welcome Modal

Create `apps/web/src/components/WelcomeModal.tsx`:

- Shows on first login only (when `onboarding_step === "welcome"`)
- Welcome message: "Welcome to [School Name]! Let's get you started."
- Brief overview of the platform's key sections (Plan, Teach, Assess)
- "Get Started" button → closes modal, advances onboarding_step to "in_progress"
- "Skip" button → closes modal, sets onboarding to completed
- Uses Modal component from `@k12/ui`

### 4. Auto-Detect Step Completion

Create `apps/core/app/services/onboarding_progress_service.rb`:

```ruby
class OnboardingProgressService
  STEPS = {
    "explore_dashboard" => -> (user) { true }, # Always complete after first login
    "create_first_unit" => -> (user) { UnitPlan.where(created_by: user).exists? },
    "align_standards" => -> (user) {
      UnitVersion.joins(:standards).where(unit_plan: UnitPlan.where(created_by: user)).exists?
    },
    "try_ai_assistant" => -> (user) { AiInvocation.where(user: user).exists? },
    "publish_unit" => -> (user) { UnitPlan.where(created_by: user, status: "published").exists? },
  }.freeze

  def initialize(user)
    @user = user
  end

  def progress
    STEPS.map do |step_id, check|
      { id: step_id, completed: check.call(@user) }
    end
  end

  def all_complete?
    STEPS.values.all? { |check| check.call(@user) }
  end
end
```

Add endpoint:
```ruby
# GET /api/v1/me/onboarding_progress
def onboarding_progress
  service = OnboardingProgressService.new(Current.user)
  render json: {
    steps: service.progress,
    all_complete: service.all_complete?,
    completed_at: Current.user.onboarding_completed_at,
  }
end
```

### 5. Add Starter Templates

Create `apps/core/db/seeds/starter_templates.rb`:

Seed 3 starter unit plan templates that are available to all tenants:
1. **"Blank Unit Plan"** — Minimal template with section headers only
2. **"5E Model Unit"** — Engage, Explore, Explain, Elaborate, Evaluate structure
3. **"UbD (Understanding by Design)"** — Stage 1 (Goals), Stage 2 (Assessment), Stage 3 (Plan)

Each template includes:
- Pre-filled section labels
- Placeholder text explaining what to write in each section
- A flag `is_system_template: true` to distinguish from user-created templates

Create a rake task and migration:
```ruby
add_column :templates, :is_system_template, :boolean, default: false, null: false
```

### 6. Add Contextual Tooltips for First Session

Create `apps/web/src/components/OnboardingTooltip.tsx`:

```typescript
interface OnboardingTooltipProps {
  stepId: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}
```

- Only shows when user is in onboarding (not completed)
- Shows once per step, then auto-dismisses
- Stored in localStorage: `onboarding_tooltips_seen`
- Positioned relative to the target element
- Arrow pointing to the element
- Close button (X)

Place tooltips on:
- "New Unit" button in Unit Library
- AI Assistant panel toggle
- Standards browser link in unit planner
- Publish button in unit editor

### 7. Update Dashboard for Onboarding

Update `apps/web/src/app/dashboard/page.tsx`:
- If `onboarding_completed_at` is null, show OnboardingChecklist card prominently
- If completed, show normal dashboard
- Checklist card position: top of page, full width, above courses section

### 8. Add Tests

**Backend:**
- `apps/core/spec/services/onboarding_progress_service_spec.rb`
  - Returns correct completion for each step
  - all_complete? returns true when all steps done

**Frontend:**
- `apps/web/src/components/__tests__/OnboardingChecklist.test.tsx`
  - Renders all steps
  - Completed steps show checkmark
  - Links navigate to correct pages
  - Skip button calls onboarding update

- `apps/web/src/components/__tests__/WelcomeModal.test.tsx`
  - Shows for first-time users
  - Get Started advances step
  - Skip completes onboarding

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_add_onboarding_to_users.rb` | Onboarding tracking columns |
| `apps/core/db/migrate/YYYYMMDD_add_system_template_flag.rb` | System template flag |
| `apps/core/app/services/onboarding_progress_service.rb` | Step completion detection |
| `apps/core/db/seeds/starter_templates.rb` | Seed starter templates |
| `apps/web/src/components/OnboardingChecklist.tsx` | Step checklist card |
| `apps/web/src/components/WelcomeModal.tsx` | First-login welcome |
| `apps/web/src/components/OnboardingTooltip.tsx` | Contextual hints |
| `apps/core/spec/services/onboarding_progress_service_spec.rb` | Service spec |
| `apps/web/src/components/__tests__/OnboardingChecklist.test.tsx` | Checklist tests |
| `apps/web/src/components/__tests__/WelcomeModal.test.tsx` | Modal tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/users_controller.rb` | Add onboarding endpoints |
| `apps/core/config/routes.rb` | Add onboarding routes |
| `apps/core/app/models/user.rb` | Onboarding columns accessible |
| `apps/core/app/models/template.rb` | Add is_system_template scope |
| `apps/web/src/app/dashboard/page.tsx` | Show checklist for new users |

---

## Definition of Done

- [ ] User model tracks onboarding_step and onboarding_completed_at
- [ ] OnboardingProgressService detects completion of 5 key steps
- [ ] GET /api/v1/me/onboarding_progress returns step completion status
- [ ] PATCH /api/v1/me/onboarding updates step and completion timestamp
- [ ] WelcomeModal shows on first login and can be dismissed
- [ ] OnboardingChecklist shows on dashboard with linked steps and progress bar
- [ ] Steps auto-complete when users perform the actual actions
- [ ] 3 starter templates seeded (Blank, 5E Model, UbD)
- [ ] Contextual tooltips appear on key UI elements during onboarding
- [ ] Skip option available at every stage
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors
