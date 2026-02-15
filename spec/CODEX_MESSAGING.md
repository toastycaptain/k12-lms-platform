# Codex Instructions — Messaging System

## Objective

Build the messaging system specified in Tech Spec §2.4 (LMS group: messages, threads) and upgrade the announcements page from a stub to a functional feature. This gives teachers and students a way to communicate within courses, and gives admins a way to broadcast announcements.

---

## What Already Exists (DO NOT recreate)

### Backend
- `apps/core/app/models/announcement.rb` — model exists
- `apps/core/app/controllers/api/v1/announcements_controller.rb` — CRUD exists
- `apps/core/app/policies/announcement_policy.rb` — policy exists

### Frontend
- `apps/web/src/app/communicate/page.tsx` — exists but is a stub (per CODEX_REMAINING_GAPS)

---

## Task 1: Create Message and Thread Models

Tech Spec §2.4 lists `messages` and `threads` in the LMS data model.

**Create migration:** `apps/core/db/migrate/[timestamp]_create_message_threads_and_messages.rb`

```ruby
class CreateMessageThreadsAndMessages < ActiveRecord::Migration[8.0]
  def change
    unless table_exists?(:message_threads)
      create_table :message_threads do |t|
        t.references :tenant, null: false, foreign_key: true
        t.references :course, foreign_key: true  # optional — nil for direct messages
        t.string :subject, null: false
        t.string :thread_type, null: false, default: "direct"  # direct, course, group
        t.timestamps
      end
      add_index :message_threads, [:tenant_id, :thread_type]
    end

    unless table_exists?(:message_thread_participants)
      create_table :message_thread_participants do |t|
        t.references :tenant, null: false, foreign_key: true
        t.references :message_thread, null: false, foreign_key: true
        t.references :user, null: false, foreign_key: true
        t.datetime :last_read_at
        t.timestamps
      end
      add_index :message_thread_participants, [:message_thread_id, :user_id], unique: true, name: "idx_thread_participants_unique"
    end

    unless table_exists?(:messages)
      create_table :messages do |t|
        t.references :tenant, null: false, foreign_key: true
        t.references :message_thread, null: false, foreign_key: true
        t.references :sender, null: false, foreign_key: { to_table: :users }
        t.text :body, null: false
        t.timestamps
      end
      add_index :messages, [:message_thread_id, :created_at]
    end
  end
end
```

**Create:** `apps/core/app/models/message_thread.rb`
```ruby
class MessageThread < ApplicationRecord
  include TenantScoped

  VALID_TYPES = %w[direct course group].freeze

  belongs_to :course, optional: true
  has_many :message_thread_participants, dependent: :destroy
  has_many :participants, through: :message_thread_participants, source: :user
  has_many :messages, dependent: :destroy

  validates :subject, presence: true
  validates :thread_type, presence: true, inclusion: { in: VALID_TYPES }

  def last_message
    messages.order(created_at: :desc).first
  end

  def unread_count_for(user)
    participant = message_thread_participants.find_by(user: user)
    return messages.count unless participant&.last_read_at
    messages.where("created_at > ?", participant.last_read_at).count
  end
end
```

**Create:** `apps/core/app/models/message_thread_participant.rb`
```ruby
class MessageThreadParticipant < ApplicationRecord
  include TenantScoped

  belongs_to :message_thread
  belongs_to :user

  validates :user_id, uniqueness: { scope: :message_thread_id }

  def mark_read!
    update!(last_read_at: Time.current)
  end
end
```

**Create:** `apps/core/app/models/message.rb`
```ruby
class Message < ApplicationRecord
  include TenantScoped

  belongs_to :message_thread
  belongs_to :sender, class_name: "User"

  validates :body, presence: true

  after_create :update_thread_timestamp

  private

  def update_thread_timestamp
    message_thread.touch
  end
end
```

---

## Task 2: Create Message Controllers

**Create:** `apps/core/app/controllers/api/v1/message_threads_controller.rb`

Actions:
- `GET /api/v1/message_threads` — list threads the current user participates in, ordered by last activity. Include last_message and unread_count.
- `GET /api/v1/message_threads/:id` — show thread with messages and participants
- `POST /api/v1/message_threads` — create new thread. Params: `{ subject, thread_type, participant_ids: [], course_id }`. Auto-include the creator as a participant.
- `DELETE /api/v1/message_threads/:id` — soft-remove the current user from the thread (remove participant record)

**Create:** `apps/core/app/controllers/api/v1/messages_controller.rb`

Actions:
- `GET /api/v1/message_threads/:thread_id/messages` — list messages in thread (paginated, chronological). Auto-mark thread as read for current user.
- `POST /api/v1/message_threads/:thread_id/messages` — create new message. Params: `{ body }`. Sender is current_user.

**Create:** Serializers for MessageThread and Message.

**Create:** Policies:
- `MessageThreadPolicy` — users can only see threads they participate in. Create is open to all authenticated users. Destroy only removes own participation.
- `MessagePolicy` — users can only create messages in threads they participate in. Read scoped to participated threads.

**Add routes:**
```ruby
resources :message_threads, only: [:index, :show, :create, :destroy] do
  resources :messages, only: [:index, :create]
end
```

---

## Task 3: Upgrade Announcements Page

The communicate page is a stub. Replace it with a combined announcements + messaging hub.

**Modify:** `apps/web/src/app/communicate/page.tsx`

**Requirements:**
1. Two tabs: "Announcements" and "Messages"
2. **Announcements tab:**
   - List announcements from `GET /api/v1/announcements`
   - Each announcement: title, message preview, author, course name, date
   - For admin/teacher: "New Announcement" button opens a form (title, message, course selector)
   - POST to `/api/v1/announcements` on submit
   - Course selector fetches from `GET /api/v1/courses`
3. **Messages tab:**
   - List message threads from `GET /api/v1/message_threads`
   - Each thread: subject, participants preview, last message preview, unread badge, time
   - Click navigates to thread detail
   - "New Message" button opens compose form

---

## Task 4: Message Thread Detail Page

**Create:** `apps/web/src/app/communicate/threads/[threadId]/page.tsx`

**Requirements:**
1. Thread header: subject, participants list, thread type badge
2. Messages list: chronological, each message shows sender name, role badge, timestamp, body
3. Current user's messages aligned right, others aligned left (chat-style layout)
4. Compose bar at bottom: text input + send button
5. Auto-scroll to newest message on load
6. Sending a message: POST to `/api/v1/message_threads/:id/messages`, append to list
7. "Back to Messages" link

---

## Task 5: Compose New Message

**Create:** `apps/web/src/app/communicate/compose/page.tsx`

**Requirements:**
1. Form: subject, recipient search (search users by name), thread_type (default "direct")
2. Recipient search: type-ahead that searches users — `GET /api/v1/users?q=name` (check if this endpoint supports search, if not add ILIKE filter)
3. Add multiple recipients as tags
4. Message body textarea
5. "Send" button — creates thread + first message via POST `/api/v1/message_threads` with `{ subject, participant_ids, thread_type }` then POST message
6. After send, navigate to the new thread

---

## Task 6: Create Factories and Specs

**Create:**
- `apps/core/spec/factories/message_threads.rb`
- `apps/core/spec/factories/message_thread_participants.rb`
- `apps/core/spec/factories/messages.rb`

**Create:**
- `apps/core/spec/models/message_thread_spec.rb` — associations, validations, `last_message`, `unread_count_for`
- `apps/core/spec/models/message_spec.rb` — associations, validations, `update_thread_timestamp`
- `apps/core/spec/policies/message_thread_policy_spec.rb` — participant-only access
- `apps/core/spec/policies/message_policy_spec.rb` — participant-only creation
- `apps/core/spec/requests/api/v1/message_threads_spec.rb` — CRUD + participant scoping
- `apps/core/spec/requests/api/v1/messages_spec.rb` — create + list within thread

---

## Architecture Rules

1. All models MUST include `TenantScoped`
2. All controllers MUST use Pundit
3. Messages are immutable once sent (no edit/delete for now)
4. Thread participant scoping is critical — users must ONLY see threads they participate in
5. Use `apiFetch` on the frontend, follow existing patterns
6. Notification integration: when a new message is created, create a Notification for each other participant (if the Notification model from CODEX_APP_SHELL_GLOBAL exists)

---

## Testing

```bash
cd apps/core && bundle exec rspec
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] MessageThread, MessageThreadParticipant, Message models with TenantScoped
- [ ] Message threads and messages controllers with Pundit
- [ ] Policies enforce participant-only access
- [ ] Routes registered
- [ ] Announcements + Messages tabs on communicate page
- [ ] Thread detail page with chat-style layout
- [ ] Compose new message page with recipient search
- [ ] Factories and specs for all new models/controllers/policies
- [ ] All lint and build checks pass
