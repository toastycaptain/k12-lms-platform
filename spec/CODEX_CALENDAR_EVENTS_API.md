# CODEX_CALENDAR_EVENTS_API — Server-Side Calendar Aggregation Endpoint

**Priority:** P0
**Effort:** Small (3–4 hours)
**Spec Refs:** PRD-17 (Teacher Planning — schedule), UX-3.4 (Calendar screen), TECH-2.6
**Depends on:** None

---

## Problem

The frontend calendar page (`/plan/calendar`) exists but constructs the calendar client-side by fetching all unit plans and all assignments, then merging them in the browser. This has three issues:

1. **Performance** — fetches entire unit_plans and assignments collections to extract date fields
2. **No event abstraction** — no unified "calendar event" concept; frontend manually merges two different shapes
3. **No iCal export** — teachers cannot subscribe to their calendar from external tools (Google Calendar, Outlook)
4. **No quiz due dates** — quizzes with `due_at` are not shown on the calendar
5. **No filtering by date range** — always fetches everything, no server-side windowing

---

## Tasks

### 1. Create Calendar Controller

Create `apps/core/app/controllers/api/v1/calendar_controller.rb`:

```ruby
class Api::V1::CalendarController < ApplicationController
  # GET /api/v1/calendar?start_date=2026-02-01&end_date=2026-03-01&course_id=optional
  def index
    authorize :calendar, :index?

    events = []
    events += unit_plan_events
    events += assignment_events
    events += quiz_events

    events.sort_by! { |e| e[:start_date] || e[:due_date] }
    render json: { events: events }
  end

  # GET /api/v1/calendar.ics
  def ical
    authorize :calendar, :index?
    events = all_events
    cal = generate_ical(events)
    send_data cal, filename: "calendar.ics", type: "text/calendar"
  end

  private

  def date_range
    start_date = params[:start_date]&.to_date || Date.current.beginning_of_month
    end_date = params[:end_date]&.to_date || start_date + 2.months
    [start_date, end_date]
  end

  def course_scope
    if params[:course_id].present?
      policy_scope(Course).where(id: params[:course_id])
    else
      policy_scope(Course)
    end
  end

  def unit_plan_events
    start_d, end_d = date_range
    UnitPlan.where(course: course_scope)
            .where("start_date <= ? AND end_date >= ?", end_d, start_d)
            .pluck(:id, :title, :start_date, :end_date, :course_id, :status)
            .map do |id, title, sd, ed, cid, status|
              { type: "unit_plan", id: id, title: title, start_date: sd, end_date: ed, course_id: cid, status: status }
            end
  end

  def assignment_events
    start_d, end_d = date_range
    Assignment.where(course: course_scope)
              .where(due_at: start_d..end_d)
              .pluck(:id, :title, :due_at, :course_id, :status)
              .map do |id, title, due, cid, status|
                { type: "assignment", id: id, title: title, due_date: due, course_id: cid, status: status }
              end
  end

  def quiz_events
    start_d, end_d = date_range
    Quiz.where(course: course_scope)
        .where(due_at: start_d..end_d)
        .pluck(:id, :title, :due_at, :course_id, :status)
        .map do |id, title, due, cid, status|
          { type: "quiz", id: id, title: title, due_date: due, course_id: cid, status: status }
        end
  end
end
```

### 2. Create Calendar Policy

Create `apps/core/app/policies/calendar_policy.rb`:
- `index?` — any authenticated user
- Students see only enrolled course events
- Teachers see taught + all own unit plans

### 3. Add iCal Generation

Use the `icalendar` gem (or build minimal iCal output) to export `.ics` format. Each event becomes a VEVENT with DTSTART, DTEND or DUE, SUMMARY, and UID.

### 4. Update Frontend Calendar

Update `apps/web/src/app/plan/calendar/page.tsx`:
- Replace dual API calls with single `GET /api/v1/calendar?start_date=&end_date=`
- Add quiz events to the calendar display
- Add "Subscribe" button linking to the `.ics` endpoint
- Add date range navigation (prev/next month) that queries server

### 5. Add Tests

- `apps/core/spec/requests/api/v1/calendar_controller_spec.rb`
- `apps/core/spec/policies/calendar_policy_spec.rb`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/calendar_controller.rb` | Calendar aggregation API |
| `apps/core/app/policies/calendar_policy.rb` | Authorization |
| `apps/core/spec/requests/api/v1/calendar_controller_spec.rb` | Request spec |
| `apps/core/spec/policies/calendar_policy_spec.rb` | Policy spec |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add calendar routes |
| `apps/core/Gemfile` | Add icalendar gem (if using) |
| `apps/web/src/app/plan/calendar/page.tsx` | Use new API, add quiz events |

---

## Definition of Done

- [ ] `GET /api/v1/calendar` returns unified events from unit_plans, assignments, quizzes
- [ ] Server-side date range filtering via start_date/end_date params
- [ ] Optional course_id filter
- [ ] Events sorted by date
- [ ] Role-scoped: students see enrolled only, teachers see taught
- [ ] `GET /api/v1/calendar.ics` returns valid iCalendar file
- [ ] Frontend calendar uses new endpoint
- [ ] Quiz due dates appear on calendar
- [ ] All specs pass
