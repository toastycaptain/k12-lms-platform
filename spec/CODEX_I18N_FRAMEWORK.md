# CODEX_I18N_FRAMEWORK — Internationalization Scaffolding for Multi-Language Support

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Accessibility), PRD-3 (Target Users — diverse school populations)
**Depends on:** None

---

## Problem

US K-12 schools serve increasingly diverse populations. Many schools have significant populations of ELL (English Language Learners) families who navigate the platform in their second language. Currently:

1. **All strings hardcoded in English** — every page, component, error message, and label is a raw English string in JSX
2. **No i18n library** — no infrastructure for string extraction, translation files, or locale switching
3. **No locale detection** — no way to detect browser locale or allow user preference
4. **No RTL support** — no CSS or layout preparation for right-to-left languages (Arabic, Hebrew)
5. **Backend messages hardcoded** — API error messages, email templates, and notification text are all English
6. **No date/number formatting** — dates and numbers don't adapt to locale conventions

Retrofitting i18n later is extremely costly. Scaffolding the framework now means new features are i18n-ready from the start, and existing strings can be extracted incrementally.

---

## Tasks

### 1. Install and Configure next-intl

Update `apps/web/package.json` — add `next-intl` dependency.

Create `apps/web/src/i18n/config.ts`:

```typescript
export const locales = ["en", "es", "zh", "ar", "vi", "ko", "tl", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

Create `apps/web/src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale || defaultLocale}.json`)).default,
}));
```

### 2. Create English Message File (Source of Truth)

Create `apps/web/src/messages/en.json`:

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search...",
    "noResults": "No results found",
    "error": "Something went wrong",
    "retry": "Try Again",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "close": "Close"
  },
  "nav": {
    "plan": "Plan",
    "teach": "Teach",
    "learn": "Learn",
    "assess": "Assess",
    "report": "Report",
    "communicate": "Communicate",
    "admin": "Admin"
  },
  "auth": {
    "signIn": "Sign in",
    "signInWithGoogle": "Sign in with Google",
    "signInWithSSO": "Sign in with SSO",
    "signOut": "Sign out",
    "unauthorized": "You are not authorized to view this page"
  },
  "dashboard": {
    "welcome": "Welcome, {name}",
    "recentUnits": "Recent Units",
    "upcomingAssignments": "Upcoming Assignments",
    "notifications": "Notifications"
  },
  "units": {
    "title": "Unit Library",
    "create": "Create Unit",
    "publish": "Publish",
    "archive": "Archive",
    "draft": "Draft",
    "published": "Published",
    "noUnits": "No units yet. Create your first unit to get started."
  },
  "gradebook": {
    "title": "Gradebook",
    "studentName": "Student Name",
    "average": "Average",
    "missing": "Missing",
    "late": "Late",
    "exportCsv": "Export CSV"
  },
  "errors": {
    "notFound": "Page not found",
    "serverError": "Server error. Please try again later.",
    "offline": "You are offline. Changes will not be saved until your connection is restored.",
    "connectionRestored": "Connection restored. Refreshing data..."
  }
}
```

Create stub files for priority languages (initially just copies of English keys with empty values to be translated):
- `apps/web/src/messages/es.json` (Spanish — most common second language in US schools)
- Others can be added incrementally

### 3. Create Translation Hook Wrapper

Create `apps/web/src/i18n/useTranslation.ts`:

```typescript
import { useTranslations } from "next-intl";

// Re-export for convenience and to centralize the import
export { useTranslations };

// Helper for formatting
export function useFormattedDate() {
  const locale = useLocale();
  return (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(locale, options || { year: "numeric", month: "short", day: "numeric" });
  };
}

export function useFormattedNumber() {
  const locale = useLocale();
  return (num: number, options?: Intl.NumberFormatOptions) => {
    return num.toLocaleString(locale, options);
  };
}
```

### 4. Create Locale Switcher Component

Create `apps/web/src/components/LocaleSwitcher.tsx`:

```typescript
interface LocaleSwitcherProps {
  className?: string;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  // Dropdown showing available locales
  // Saves preference to localStorage and user profile (if logged in)
  // Updates the Next.js locale context
  // Shows language name in its own script (e.g., "Español", "中文", "العربية")
}
```

Add to AppShell top bar and login page.

### 5. Add User Locale Preference

Create migration for users table:

```ruby
class AddLocaleToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :locale, :string, default: "en", null: false
  end
end
```

Update `apps/core/app/controllers/api/v1/users_controller.rb`:
- Include `locale` in user update params
- Return `locale` in user serializer

Update `apps/web/src/lib/auth-context.tsx`:
- After login, set app locale from user profile `locale` field
- Save locale changes to user profile via API

### 6. Add RTL CSS Foundation

Update `apps/web/src/app/layout.tsx`:
- Set `dir` attribute on `<html>` tag based on locale
- Arabic (`ar`) and Hebrew (`he`) use `dir="rtl"`

Create `apps/web/src/styles/rtl.css`:

```css
[dir="rtl"] {
  /* Flip layout direction */
  direction: rtl;
}

/* Override specific components that need manual RTL handling */
[dir="rtl"] .nav-sidebar {
  left: auto;
  right: 0;
}

[dir="rtl"] .breadcrumb-separator {
  transform: scaleX(-1);
}
```

Note: Tailwind CSS v3+ has built-in RTL support via `rtl:` prefix. Most layouts using flexbox/grid will auto-flip.

### 7. Configure Rails i18n Backend

Update `apps/core/config/locales/`:
- Create `en.yml` with API error messages, email subjects, notification text
- Create `es.yml` stub

Update `apps/core/config/application.rb`:

```ruby
config.i18n.available_locales = [:en, :es, :zh, :ar, :vi, :ko, :tl, :fr]
config.i18n.default_locale = :en
```

Update ApplicationController to set locale from user preference:

```ruby
before_action :set_locale

def set_locale
  I18n.locale = Current.user&.locale&.to_sym || I18n.default_locale
end
```

### 8. Migrate High-Traffic Pages (Incremental Start)

Convert the following pages to use `useTranslations()` instead of hardcoded strings:
- `apps/web/src/app/login/page.tsx` — auth strings
- `apps/web/src/components/AppShell.tsx` — navigation labels
- `apps/web/src/app/dashboard/page.tsx` — dashboard strings
- `apps/web/src/components/ConnectionBanner.tsx` — offline/online messages
- `apps/web/src/components/RetryError.tsx` — error messages

This demonstrates the pattern. Remaining pages can be migrated incrementally in future batches.

### 9. Add Tests

**Frontend:**
- `apps/web/src/components/__tests__/LocaleSwitcher.test.tsx`
  - Renders locale options
  - Switching locale updates context
  - Persists preference

- `apps/web/src/i18n/__tests__/useTranslation.test.ts`
  - Returns correct translated string
  - Interpolates variables ({name})
  - Falls back to English for missing translations
  - Date formatting respects locale
  - Number formatting respects locale

**Backend:**
- `apps/core/spec/requests/locale_spec.rb`
  - API returns messages in user's locale
  - Falls back to English for unsupported locale
  - User locale preference persists

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/i18n/config.ts` | Locale configuration |
| `apps/web/src/i18n/request.ts` | next-intl request config |
| `apps/web/src/i18n/useTranslation.ts` | Translation hook + formatting helpers |
| `apps/web/src/messages/en.json` | English message file (source of truth) |
| `apps/web/src/messages/es.json` | Spanish message file (stub) |
| `apps/web/src/components/LocaleSwitcher.tsx` | Locale picker component |
| `apps/web/src/styles/rtl.css` | RTL layout overrides |
| `apps/core/config/locales/en.yml` | Rails English messages |
| `apps/core/config/locales/es.yml` | Rails Spanish messages (stub) |
| `apps/core/db/migrate/YYYYMMDD_add_locale_to_users.rb` | User locale preference |
| `apps/web/src/components/__tests__/LocaleSwitcher.test.tsx` | Switcher tests |
| `apps/web/src/i18n/__tests__/useTranslation.test.ts` | Translation tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/package.json` | Add next-intl dependency |
| `apps/web/src/app/layout.tsx` | Add i18n provider, RTL dir attribute |
| `apps/web/src/components/AppShell.tsx` | Use translated nav labels, add LocaleSwitcher |
| `apps/web/src/app/login/page.tsx` | Use translated auth strings |
| `apps/web/src/app/dashboard/page.tsx` | Use translated dashboard strings |
| `apps/web/src/components/ConnectionBanner.tsx` | Use translated messages |
| `apps/web/src/components/RetryError.tsx` | Use translated messages |
| `apps/core/config/application.rb` | Configure available locales |
| `apps/core/app/controllers/application_controller.rb` | Set locale from user preference |
| `apps/core/app/serializers/user_serializer.rb` | Include locale field |

---

## Definition of Done

- [ ] next-intl installed and configured with locale detection
- [ ] English message file covers common, nav, auth, dashboard, gradebook, and error strings
- [ ] Spanish stub message file created for future translation
- [ ] LocaleSwitcher component in AppShell and login page
- [ ] User locale preference stored in database and respected on login
- [ ] RTL CSS foundation works for Arabic locale
- [ ] Rails API respects user locale for error messages
- [ ] 5 high-traffic pages converted to use translation hooks
- [ ] Date and number formatting adapts to locale
- [ ] All tests pass
- [ ] No TypeScript errors
