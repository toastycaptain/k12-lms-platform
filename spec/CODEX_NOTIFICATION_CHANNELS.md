# CODEX_NOTIFICATION_CHANNELS — Multi-Channel Notification Delivery

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-22 (Functional — Audit logging), PRD-23 (Reliability), TECH-2.11 (Observability)
**Depends on:** None

---

## Problem

`NotificationService` (39 lines) only creates database `Notification` records. There is no delivery mechanism beyond polling the notifications endpoint from the frontend. Users have no way to receive notifications outside the app:

1. **No email delivery** — assignment due dates, grade posted, announcements not emailed
2. **No notification preferences** — users can't choose which notifications they want
3. **No digest mode** — no daily/weekly summary emails
4. **No delivery tracking** — no record of whether a notification was read or delivered
5. **NotificationBell only polls** — no real-time push (acceptable per PRD-16 out-of-scope, but email is needed)

---

## Tasks

### 1. Add Email Delivery via Action Mailer

Create `apps/core/app/mailers/notification_mailer.rb`:

```ruby
class NotificationMailer < ApplicationMailer
  def notification_email(notification)
    @notification = notification
    @user = notification.user
    @url = notification_url(notification)

    mail(
      to: @user.email,
      subject: notification_subject(notification),
    )
  end

  def daily_digest(user, notifications)
    @user = user
    @notifications = notifications
    mail(
      to: user.email,
      subject: "Daily Summary — #{Date.current.strftime('%b %d, %Y')}",
    )
  end

  private

  def notification_subject(notification)
    case notification.event_type
    when "assignment_graded" then "Grade posted: #{notification.metadata['assignment_title']}"
    when "assignment_due_soon" then "Due soon: #{notification.metadata['assignment_title']}"
    when "announcement_posted" then "New announcement: #{notification.metadata['title']}"
    when "submission_received" then "Submission received from #{notification.metadata['student_name']}"
    when "approval_requested" then "Approval needed: #{notification.metadata['title']}"
    else "K-12 LMS Notification"
    end
  end
end
```

Create email templates:
- `apps/core/app/views/notification_mailer/notification_email.html.erb`
- `apps/core/app/views/notification_mailer/daily_digest.html.erb`

### 2. Add Notification Preferences

Create migration:
```ruby
class CreateNotificationPreferences < ActiveRecord::Migration[8.0]
  def change
    create_table :notification_preferences do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :event_type, null: false
      t.boolean :in_app, null: false, default: true
      t.boolean :email, null: false, default: true
      t.string :email_frequency, null: false, default: "immediate"  # immediate, daily, weekly, never
      t.timestamps
    end

    add_index :notification_preferences, [:user_id, :event_type], unique: true
  end
end
```

Model `apps/core/app/models/notification_preference.rb`:
- `include TenantScoped`
- `belongs_to :user`
- Validates event_type in known list
- Validates email_frequency in `%w[immediate daily weekly never]`
- Class method `for_user(user)` — returns hash of preferences with defaults

Default event types:
- `assignment_graded`, `assignment_due_soon`, `assignment_created`
- `announcement_posted`
- `submission_received` (teacher)
- `quiz_graded`
- `approval_requested`, `approval_resolved`
- `message_received`

### 3. Expand NotificationService

Update `apps/core/app/services/notification_service.rb`:

```ruby
class NotificationService
  def notify(user:, event_type:, notifiable:, actor: nil, metadata: {})
    prefs = NotificationPreference.for_user(user)
    pref = prefs[event_type]

    # Always create in-app notification if enabled (default: true)
    if pref[:in_app]
      notification = Notification.create!(
        tenant: Current.tenant,
        user: user,
        actor: actor,
        notifiable: notifiable,
        event_type: event_type,
        metadata: metadata,
      )
    end

    # Send email based on preference
    case pref[:email_frequency]
    when "immediate"
      NotificationMailer.notification_email(notification).deliver_later
    when "daily", "weekly"
      # Will be picked up by digest job
    end

    notification
  end

  def notify_enrolled_students(course:, event_type:, notifiable:, actor: nil, metadata: {})
    students = User.joins(enrollments: :section).where(sections: { course_id: course.id })
    students.find_each do |student|
      notify(user: student, event_type: event_type, notifiable: notifiable, actor: actor, metadata: metadata)
    end
  end
end
```

### 4. Create Digest Job

Create `apps/core/app/jobs/notification_digest_job.rb`:

```ruby
class NotificationDigestJob < ApplicationJob
  queue_as :default

  def perform(frequency) # "daily" or "weekly"
    User.joins(:notification_preferences)
        .where(notification_preferences: { email_frequency: frequency })
        .distinct
        .find_each do |user|
      Current.tenant = user.tenant
      since = frequency == "daily" ? 1.day.ago : 1.week.ago
      notifications = user.notifications.where("created_at >= ?", since).unread

      next if notifications.empty?

      NotificationMailer.daily_digest(user, notifications).deliver_later
    end
  end
end
```

Schedule in `apps/core/config/recurring.yml`:
```yaml
notification_daily_digest:
  class: NotificationDigestJob
  args: ["daily"]
  cron: "0 7 * * *"  # 7 AM daily

notification_weekly_digest:
  class: NotificationDigestJob
  args: ["weekly"]
  cron: "0 7 * * 1"  # 7 AM Monday
```

### 5. Create Notification Preferences API

Create `apps/core/app/controllers/api/v1/notification_preferences_controller.rb`:
- `GET /api/v1/notification_preferences` — list user's preferences (with defaults)
- `PATCH /api/v1/notification_preferences/:event_type` — update preference

### 6. Create Notification Settings UI

Create `apps/web/src/app/notifications/settings/page.tsx`:

- Table of event types with toggle columns:
  - Event name (human-readable)
  - In-app (toggle switch)
  - Email (toggle switch)
  - Frequency dropdown (Immediate / Daily Digest / Weekly Digest / Never)
- Save button with toast feedback
- Link from notification bell dropdown: "Notification Settings"

### 7. Wire Notifications into Existing Workflows

Add notification triggers to existing controllers/jobs:

| Event | Where to Trigger | Notifies |
|-------|-----------------|----------|
| `assignment_created` | AssignmentsController#create | Enrolled students |
| `assignment_graded` | SubmissionGradingController#update | Student |
| `assignment_due_soon` | New job: `DueDateReminderJob` | Students with unsubmitted assignments |
| `announcement_posted` | AnnouncementsController#create | Enrolled students |
| `submission_received` | SubmissionsController#create | Course teacher |
| `quiz_graded` | QuizAttemptsController auto-grade | Student |
| `approval_requested` | ApprovalsController#create | Approvers (admin/curriculum_lead) |
| `message_received` | MessagesController#create | Thread participants |

### 8. Create DueDateReminderJob

Create `apps/core/app/jobs/due_date_reminder_job.rb`:
- Runs daily at 8 AM
- Finds assignments due within next 24 hours
- Notifies enrolled students who haven't submitted
- Idempotent (don't re-notify for same assignment/student)

### 9. Add Tests

- `apps/core/spec/models/notification_preference_spec.rb`
- `apps/core/spec/services/notification_service_spec.rb` — expanded for email + preferences
- `apps/core/spec/mailers/notification_mailer_spec.rb`
- `apps/core/spec/jobs/notification_digest_job_spec.rb`
- `apps/core/spec/jobs/due_date_reminder_job_spec.rb`
- `apps/core/spec/requests/api/v1/notification_preferences_controller_spec.rb`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_notification_preferences.rb` | Preferences table |
| `apps/core/app/models/notification_preference.rb` | Preference model |
| `apps/core/app/mailers/notification_mailer.rb` | Email delivery |
| `apps/core/app/mailers/application_mailer.rb` | Base mailer (if missing) |
| `apps/core/app/views/notification_mailer/notification_email.html.erb` | Email template |
| `apps/core/app/views/notification_mailer/daily_digest.html.erb` | Digest template |
| `apps/core/app/views/layouts/mailer.html.erb` | Mailer layout |
| `apps/core/app/jobs/notification_digest_job.rb` | Daily/weekly digest |
| `apps/core/app/jobs/due_date_reminder_job.rb` | Due date reminders |
| `apps/core/app/controllers/api/v1/notification_preferences_controller.rb` | Preferences API |
| `apps/core/app/policies/notification_preference_policy.rb` | Preferences policy |
| `apps/core/app/serializers/notification_preference_serializer.rb` | Preferences serializer |
| `apps/web/src/app/notifications/settings/page.tsx` | Settings UI |
| `apps/core/spec/models/notification_preference_spec.rb` | Model spec |
| `apps/core/spec/mailers/notification_mailer_spec.rb` | Mailer spec |
| `apps/core/spec/jobs/notification_digest_job_spec.rb` | Job spec |
| `apps/core/spec/jobs/due_date_reminder_job_spec.rb` | Job spec |
| `apps/core/spec/requests/api/v1/notification_preferences_controller_spec.rb` | Request spec |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/services/notification_service.rb` | Add email delivery + preferences |
| `apps/core/config/routes.rb` | Add notification_preferences routes |
| `apps/core/config/recurring.yml` | Schedule digest jobs |
| Various controllers | Add notification triggers |

---

## Definition of Done

- [ ] NotificationPreference model with event types and frequency settings
- [ ] NotificationMailer delivers individual and digest emails
- [ ] NotificationService respects user preferences for channel and frequency
- [ ] Digest job sends daily/weekly summaries
- [ ] DueDateReminderJob notifies students of upcoming deadlines
- [ ] Notification triggers wired into 8+ existing workflows
- [ ] Preferences API with GET/PATCH endpoints
- [ ] Settings page allows users to configure notification preferences
- [ ] All specs pass
- [ ] No Rubocop violations
