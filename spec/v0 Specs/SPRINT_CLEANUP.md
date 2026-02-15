# Cleanup: Remaining Code Quality Items

Three minor code quality issues that were flagged during the audit but not addressed in the previous sprints.

---

## 1. Replace bare `rescue => e` blocks in `classroom_roster_sync_job.rb`

**File:** `apps/core/app/jobs/classroom_roster_sync_job.rb`

**Problem:** Lines 77 and 85 use bare `rescue => e` which catches all `StandardError` subclasses indiscriminately. This masks unexpected errors (e.g. `NoMethodError`, `TypeError`) and prevents the job retry system from seeing them.

**Current (line 77 — inner loop):**
```ruby
rescue => e
  failed += 1
  sync_run.log_error("Failed to sync student: #{e.message}", external_id: student.user_id)
end
```

**Current (line 85 — outer block):**
```ruby
rescue => e
  sync_run.fail!(e.message)
  raise
end
```

**Fix:**

For the **inner rescue** (line 77), catch only the exceptions that can reasonably occur during a student sync iteration — record validation failures and Google API errors:

```ruby
rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique, Google::Apis::Error => e
  failed += 1
  sync_run.log_error("Failed to sync student: #{e.message}", external_id: student.user_id)
end
```

For the **outer rescue** (line 85), catch `StandardError` explicitly to make intent clear, and let `Exception` subclasses (e.g. `SignalException`, `SystemExit`) propagate naturally:

```ruby
rescue StandardError => e
  sync_run.fail!(e.message)
  raise
end
```

Check the other sync jobs for the same pattern:
- `app/jobs/classroom_course_sync_job.rb`
- `app/jobs/one_roster_org_sync_job.rb`
- `app/jobs/one_roster_user_sync_job.rb`

Apply the same fix if they have bare `rescue => e` blocks.

---

## 2. Extract duplicated `privileged_user?` from `assignment_policy.rb`

**File:** `apps/core/app/policies/assignment_policy.rb`

**Problem:** `privileged_user?` is defined identically in two places — once in the `Scope` inner class (lines 57–59) and once in the outer policy (lines 78–80). Both are:

```ruby
def privileged_user?
  user.has_role?(:admin) || user.has_role?(:curriculum_lead)
end
```

This pattern is likely duplicated in other policies too. Search for `def privileged_user?` across `app/policies/` to find all instances.

**Fix:**

Move the method into `ApplicationPolicy` so both the policy and its `Scope` inherit it:

```ruby
# app/policies/application_policy.rb
class ApplicationPolicy
  # ... existing code ...

  private

  def privileged_user?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  class Scope
    # ... existing code ...

    private

    def privileged_user?
      user.has_role?(:admin) || user.has_role?(:curriculum_lead)
    end
  end
end
```

Note: the `Scope` class and the outer policy have separate inheritance trees, so the method must be defined in both `ApplicationPolicy` and `ApplicationPolicy::Scope`. The point is to define it once in each base class rather than in every subclass.

Then remove the `privileged_user?` definitions from `AssignmentPolicy`, `AssignmentPolicy::Scope`, and every other policy that duplicates them. Run `grep -rn "def privileged_user?" app/policies/` to find them all.

After the extraction, run the full policy spec suite to confirm nothing broke:
```bash
bundle exec rspec spec/policies/
```

---

## 3. Replace silent `catch` in `dashboard/page.tsx`

**File:** `apps/web/src/app/dashboard/page.tsx`

**Problem:** Lines 52–54 have an empty catch block that silently swallows errors:

```typescript
} catch {
  // API may not be available in dev
}
```

Now that Sentry is integrated, errors here should be reported.

**Fix:** Capture the error and log it. Use `console.error` as a baseline and `Sentry.captureException` for production visibility:

```typescript
} catch (error) {
  console.error("Failed to load dashboard data:", error);
}
```

Sentry's global error handler will pick up the `console.error` if source-map integration is configured. If you want explicit Sentry reporting:

```typescript
import * as Sentry from "@sentry/nextjs";

} catch (error) {
  Sentry.captureException(error);
}
```

Choose whichever approach matches the project's convention for non-critical fetch failures. The key requirement is that the error is no longer silently discarded.
