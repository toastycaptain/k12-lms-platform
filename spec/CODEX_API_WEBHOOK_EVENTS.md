# CODEX_API_WEBHOOK_EVENTS — Outbound Webhook System for External Integrations

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-15 (Institutional Hardening — integrations), TECH-2.7 (Background Jobs), PRD-22 (Audit logging)
**Depends on:** None

---

## Problem

The platform has inbound integrations (OneRoster import, LTI launch, Google Classroom sync) but no outbound event notification system. External systems cannot react to events in the LMS:

1. **No webhook delivery** — external SIS/ERP systems cannot receive notifications when grades change, students enroll, or assignments are created
2. **No event stream** — no pub/sub or event log that external systems can subscribe to
3. **No integration marketplace** — schools with custom tools have no API to connect them
4. **No real-time sync** — external grade books, attendance systems, and parent communication tools must poll for changes
5. **No retry/delivery guarantee** — even if webhooks were added, there's no retry mechanism for failed deliveries
6. **OneRoster is inbound-only** — the OneRoster integration imports data but doesn't push changes back

This limits the platform's ability to fit into a school's broader technology ecosystem.

---

## Tasks

### 1. Create Webhook Models

Create migration:

```ruby
class CreateWebhookInfrastructure < ActiveRecord::Migration[8.0]
  def change
    create_table :webhook_endpoints do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :url, null: false
      t.string :secret, null: false          # HMAC signing secret
      t.string :description
      t.string :status, null: false, default: "active"  # "active", "paused", "disabled"
      t.jsonb :event_types, null: false, default: []     # Which events to deliver
      t.integer :failure_count, null: false, default: 0
      t.datetime :last_success_at
      t.datetime :last_failure_at
      t.timestamps
    end

    add_index :webhook_endpoints, [:tenant_id, :status]

    create_table :webhook_deliveries do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :webhook_endpoint, null: false, foreign_key: true
      t.string :event_type, null: false
      t.jsonb :payload, null: false, default: {}
      t.integer :response_status
      t.text :response_body
      t.string :delivery_status, null: false, default: "pending"  # "pending", "delivered", "failed", "retrying"
      t.integer :attempt_count, null: false, default: 0
      t.datetime :delivered_at
      t.datetime :next_retry_at
      t.timestamps
    end

    add_index :webhook_deliveries, [:webhook_endpoint_id, :delivery_status]
    add_index :webhook_deliveries, :next_retry_at
  end
end
```

### 2. Create Webhook Models

Model `apps/core/app/models/webhook_endpoint.rb`:
- `include TenantScoped`
- `belongs_to :created_by, class_name: "User"`
- `has_many :webhook_deliveries, dependent: :destroy`
- Validates url format (must be HTTPS in production)
- Validates event_types is a non-empty array
- Scope `active` — `where(status: "active")`
- Scope `for_event(type)` — `where("event_types @> ?", [type].to_json)`
- `auto_disable!` — disables endpoint after 10 consecutive failures
- Generates `secret` via `SecureRandom.hex(32)` on create

Model `apps/core/app/models/webhook_delivery.rb`:
- `include TenantScoped`
- `belongs_to :webhook_endpoint`
- Validates delivery_status inclusion
- Scope `pending` — `where(delivery_status: "pending")`
- Scope `retriable` — `where(delivery_status: "retrying").where("next_retry_at <= ?", Time.current)`

### 3. Define Event Types

Create `apps/core/app/models/concerns/webhook_events.rb`:

```ruby
module WebhookEvents
  EVENTS = {
    # Enrollment
    "enrollment.created" => "A student was enrolled in a section",
    "enrollment.deleted" => "A student was unenrolled from a section",

    # Grades
    "submission.graded" => "A submission was graded",
    "submission.returned" => "A graded submission was returned to the student",
    "gradebook.updated" => "Bulk grades were updated",

    # Assignments
    "assignment.created" => "A new assignment was created",
    "assignment.published" => "An assignment was published",
    "assignment.due_date_changed" => "An assignment's due date was changed",

    # Courses
    "course.created" => "A new course was created",
    "course.published" => "A course was published",
    "course.archived" => "A course was archived",

    # Users
    "user.created" => "A new user was created",
    "user.role_changed" => "A user's role was changed",
    "user.deactivated" => "A user was deactivated",

    # Quiz
    "quiz_attempt.submitted" => "A student submitted a quiz attempt",
    "quiz_attempt.graded" => "A quiz attempt was auto-graded",

    # Planning
    "unit_plan.published" => "A unit plan was published",
    "approval.requested" => "An approval was requested",
    "approval.approved" => "An approval was approved",
    "approval.rejected" => "An approval was rejected",
  }.freeze

  def self.all
    EVENTS.keys
  end

  def self.categories
    EVENTS.keys.map { |e| e.split(".").first }.uniq
  end
end
```

### 4. Create Event Dispatcher

Create `apps/core/app/services/webhook_dispatcher.rb`:

```ruby
class WebhookDispatcher
  def self.dispatch(event_type, payload)
    return unless WebhookEvents::EVENTS.key?(event_type)

    endpoints = WebhookEndpoint.active.for_event(event_type).where(tenant: Current.tenant)
    endpoints.each do |endpoint|
      delivery = endpoint.webhook_deliveries.create!(
        event_type: event_type,
        payload: payload,
        tenant: Current.tenant,
        delivery_status: "pending",
      )
      WebhookDeliveryJob.perform_later(delivery.id)
    end
  end
end
```

### 5. Create Delivery Job with Retry Logic

Create `apps/core/app/jobs/webhook_delivery_job.rb`:

```ruby
class WebhookDeliveryJob < ApplicationJob
  queue_as :webhooks
  retry_on StandardError, wait: :polynomially_longer, attempts: 5

  MAX_RETRIES = 5
  RETRY_INTERVALS = [30.seconds, 2.minutes, 10.minutes, 1.hour, 6.hours].freeze

  def perform(delivery_id)
    delivery = WebhookDelivery.find(delivery_id)
    endpoint = delivery.webhook_endpoint

    return if endpoint.status == "disabled"

    response = deliver(endpoint, delivery)

    if response.code.to_i.between?(200, 299)
      delivery.update!(
        delivery_status: "delivered",
        response_status: response.code.to_i,
        response_body: response.body.truncate(1000),
        delivered_at: Time.current,
        attempt_count: delivery.attempt_count + 1,
      )
      endpoint.update!(failure_count: 0, last_success_at: Time.current)
    else
      handle_failure(delivery, endpoint, response)
    end
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError => e
    handle_failure(delivery, endpoint, nil, e.message)
  end

  private

  def deliver(endpoint, delivery)
    payload = delivery.payload.to_json
    timestamp = Time.current.to_i.to_s
    signature = OpenSSL::HMAC.hexdigest("SHA256", endpoint.secret, "#{timestamp}.#{payload}")

    uri = URI.parse(endpoint.url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = 5
    http.read_timeout = 10

    request = Net::HTTP::Post.new(uri.path)
    request["Content-Type"] = "application/json"
    request["X-K12-Event"] = delivery.event_type
    request["X-K12-Signature"] = "sha256=#{signature}"
    request["X-K12-Timestamp"] = timestamp
    request["X-K12-Delivery-ID"] = delivery.id.to_s
    request.body = payload

    http.request(request)
  end

  def handle_failure(delivery, endpoint, response, error_message = nil)
    attempt = delivery.attempt_count + 1

    if attempt >= MAX_RETRIES
      delivery.update!(
        delivery_status: "failed",
        response_status: response&.code&.to_i,
        response_body: error_message || response&.body&.truncate(1000),
        attempt_count: attempt,
      )
      endpoint.increment!(:failure_count)
      endpoint.update!(last_failure_at: Time.current)
      endpoint.auto_disable! if endpoint.failure_count >= 10
    else
      delivery.update!(
        delivery_status: "retrying",
        response_status: response&.code&.to_i,
        response_body: error_message || response&.body&.truncate(1000),
        attempt_count: attempt,
        next_retry_at: RETRY_INTERVALS[attempt - 1].from_now,
      )
      WebhookDeliveryJob.set(wait: RETRY_INTERVALS[attempt - 1]).perform_later(delivery.id)
    end
  end
end
```

### 6. Wire Events into Existing Models

Add webhook dispatch calls to key model callbacks:

```ruby
# In Submission model:
after_update_commit :dispatch_grade_event, if: :saved_change_to_grade?

def dispatch_grade_event
  WebhookDispatcher.dispatch("submission.graded", {
    submission_id: id,
    student_id: user_id,
    assignment_id: assignment_id,
    grade: grade,
    graded_at: graded_at&.iso8601,
  })
end
```

Apply similar dispatch calls to:
- Enrollment — created, destroyed
- Assignment — created, published
- Course — created, published, archived
- User — created, role_changed
- QuizAttempt — submitted
- UnitPlan — published
- Approval — requested, approved, rejected

### 7. Create Webhook Admin API

Create `apps/core/app/controllers/api/v1/webhooks_controller.rb`:

```ruby
class Api::V1::WebhooksController < ApplicationController
  # GET /api/v1/webhooks
  def index
    authorize :webhook, :manage?
    endpoints = WebhookEndpoint.where(tenant: Current.tenant).order(created_at: :desc)
    render json: endpoints
  end

  # POST /api/v1/webhooks
  def create
    authorize :webhook, :manage?
    endpoint = WebhookEndpoint.new(webhook_params)
    endpoint.tenant = Current.tenant
    endpoint.created_by = Current.user
    endpoint.save!
    render json: endpoint, status: :created
  end

  # POST /api/v1/webhooks/:id/test
  def test
    authorize :webhook, :manage?
    endpoint = WebhookEndpoint.find(params[:id])
    delivery = endpoint.webhook_deliveries.create!(
      event_type: "test.ping",
      payload: { message: "Test webhook delivery", timestamp: Time.current.iso8601 },
      tenant: Current.tenant,
    )
    WebhookDeliveryJob.perform_later(delivery.id)
    render json: { status: "test_queued", delivery_id: delivery.id }
  end

  # GET /api/v1/webhooks/:id/deliveries
  def deliveries
    authorize :webhook, :manage?
    endpoint = WebhookEndpoint.find(params[:id])
    deliveries = endpoint.webhook_deliveries.order(created_at: :desc).limit(50)
    render json: deliveries
  end

  # GET /api/v1/webhooks/event_types
  def event_types
    authorize :webhook, :manage?
    render json: WebhookEvents::EVENTS
  end
end
```

### 8. Build Webhook Admin Page

Create `apps/web/src/app/admin/webhooks/page.tsx`:

**Layout:**
- **Endpoint List** — Table: URL, status (active/paused/disabled), event types, last delivery, failure count
- **Create Endpoint** — Form: URL, description, event type checkboxes (grouped by category), test button
- **Endpoint Detail** — Click to expand: delivery log table (event type, status, response code, timestamp), retry button for failed deliveries

**Delivery Log:**
- Table columns: Event, Status (color badge), Response Code, Attempt Count, Delivered At
- Expand row to see full payload and response body
- "Retry" button on failed deliveries

### 9. Add Tests

**Backend:**
- `apps/core/spec/models/webhook_endpoint_spec.rb`
  - Validates URL format
  - Generates secret on create
  - Auto-disables after 10 failures
  - Scopes by event type

- `apps/core/spec/jobs/webhook_delivery_job_spec.rb`
  - Delivers payload with HMAC signature
  - Marks as delivered on 2xx response
  - Retries on 5xx with exponential backoff
  - Marks as failed after max retries
  - Handles timeout errors

- `apps/core/spec/services/webhook_dispatcher_spec.rb`
  - Dispatches to all active endpoints for event type
  - Skips disabled endpoints
  - Creates delivery records

- `apps/core/spec/requests/api/v1/webhooks_controller_spec.rb`
  - CRUD operations
  - Test ping delivery
  - Delivery log retrieval
  - Authorization (admin only)

**Frontend:**
- `apps/web/src/app/admin/webhooks/page.test.tsx`
  - Renders endpoint list
  - Create form validates URL
  - Event type checkboxes grouped by category
  - Delivery log renders

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_webhook_infrastructure.rb` | Endpoints and deliveries tables |
| `apps/core/app/models/webhook_endpoint.rb` | Webhook endpoint model |
| `apps/core/app/models/webhook_delivery.rb` | Delivery tracking model |
| `apps/core/app/models/concerns/webhook_events.rb` | Event type registry |
| `apps/core/app/services/webhook_dispatcher.rb` | Event dispatch service |
| `apps/core/app/jobs/webhook_delivery_job.rb` | Delivery job with retry |
| `apps/core/app/controllers/api/v1/webhooks_controller.rb` | Webhook admin API |
| `apps/core/app/policies/webhook_policy.rb` | Admin-only policy |
| `apps/core/app/serializers/webhook_endpoint_serializer.rb` | Endpoint serializer |
| `apps/core/app/serializers/webhook_delivery_serializer.rb` | Delivery serializer |
| `apps/web/src/app/admin/webhooks/page.tsx` | Webhook admin UI |
| `apps/core/spec/models/webhook_endpoint_spec.rb` | Model tests |
| `apps/core/spec/jobs/webhook_delivery_job_spec.rb` | Job tests |
| `apps/core/spec/services/webhook_dispatcher_spec.rb` | Dispatcher tests |
| `apps/core/spec/requests/api/v1/webhooks_controller_spec.rb` | API tests |
| `apps/web/src/app/admin/webhooks/page.test.tsx` | UI tests |
| `apps/core/spec/factories/webhook_endpoints.rb` | Factory |
| `apps/core/spec/factories/webhook_deliveries.rb` | Factory |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add webhook routes |
| `apps/core/app/models/submission.rb` | Add grade dispatch callback |
| `apps/core/app/models/enrollment.rb` | Add enrollment dispatch callback |
| `apps/core/app/models/assignment.rb` | Add publish dispatch callback |
| `apps/core/app/models/course.rb` | Add lifecycle dispatch callbacks |
| `apps/core/app/models/user.rb` | Add creation dispatch callback |
| `apps/core/app/models/quiz_attempt.rb` | Add submission dispatch callback |
| `apps/core/app/models/approval.rb` | Add status change dispatch callbacks |
| `apps/web/src/components/AppShell.tsx` | Add "Webhooks" link under Admin > Integrations |

---

## Definition of Done

- [ ] WebhookEndpoint model supports CRUD with HTTPS URL validation and secret generation
- [ ] WebhookDelivery tracks delivery attempts, status, and response data
- [ ] 20 event types defined across enrollment, grade, assignment, course, user, quiz, and planning categories
- [ ] WebhookDispatcher dispatches events to all active subscribed endpoints
- [ ] WebhookDeliveryJob delivers with HMAC-SHA256 signature and retries up to 5 times
- [ ] Endpoints auto-disable after 10 consecutive failures
- [ ] Test ping endpoint allows verifying webhook URL
- [ ] Webhook admin page provides endpoint CRUD and delivery log
- [ ] Events wired into Submission, Enrollment, Assignment, Course, User, QuizAttempt, and Approval models
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
