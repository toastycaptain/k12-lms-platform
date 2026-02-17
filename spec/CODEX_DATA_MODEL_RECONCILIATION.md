# CODEX_DATA_MODEL_RECONCILIATION — Align Schema to TECH_SPEC §2.4

**Priority:** P0
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.4 (Core Data Model)
**Depends on:** None

---

## Problem

TECH_SPEC §2.4 defines the canonical data model. Three entities listed in the spec are missing from the database:

| Entity | Spec Section | Status | Impact |
|--------|-------------|--------|--------|
| `permissions` | §2.4 Identity/Organization | MISSING | Cannot do admin-configurable fine-grained RBAC |
| `guardian_links` | §2.4 Identity/Organization | MISSING | Cannot link parents/guardians to students |
| `question_versions` | §2.4 Assessment | MISSING | Cannot version assessment questions |

Currently:
- **Permissions:** Authorization is entirely code-based via hardcoded role checks in Pundit policies (`user.has_role?(:admin)`). No way for admins to configure custom permission sets per role.
- **Guardian links:** Parent/guardian user personas (PRD-4) have no data pathway to student records.
- **Question versions:** Questions are immutable. Unit plans and lesson plans have versioning (`unit_versions`, `lesson_versions`), but questions do not, creating inconsistency.

---

## Tasks

### 1. Create `permissions` Table and Model

Migration:
```ruby
class CreatePermissions < ActiveRecord::Migration[8.0]
  def change
    create_table :permissions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :role, null: false, foreign_key: true
      t.string :resource, null: false        # e.g., "unit_plans", "courses", "assignments"
      t.string :action, null: false          # e.g., "read", "create", "update", "delete", "publish"
      t.boolean :granted, null: false, default: false
      t.timestamps
    end

    add_index :permissions, [:tenant_id, :role_id, :resource, :action], unique: true, name: "idx_permissions_unique"
  end
end
```

Model `apps/core/app/models/permission.rb`:
- `include TenantScoped`
- `belongs_to :role`
- Validates resource inclusion in known resource list
- Validates action inclusion in `%w[read create update delete publish approve manage]`
- Class method `granted_for(role, resource, action)` — returns boolean
- Scope `for_role(role)` — filters by role

### 2. Wire Permissions into Pundit Policies

Create `apps/core/app/policies/concerns/permission_checkable.rb`:
```ruby
module PermissionCheckable
  extend ActiveSupport::Concern

  private

  def has_permission?(action, resource = nil)
    resource ||= self.class.name.sub("Policy", "").underscore.pluralize
    # Check code-based role first (backward compatible)
    return true if user.has_role?(:admin)
    # Then check database permissions
    Permission.exists?(
      tenant: Current.tenant,
      role: user.roles,
      resource: resource,
      action: action.to_s,
      granted: true
    )
  end
end
```

Integrate into `ApplicationPolicy` so all policies can use `has_permission?(:read)`.

**Important:** Keep backward compatibility. Existing hardcoded role checks continue to work. Permissions table adds an additional layer admins can configure.

### 3. Create `guardian_links` Table and Model

Migration:
```ruby
class CreateGuardianLinks < ActiveRecord::Migration[8.0]
  def change
    create_table :guardian_links do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :guardian, null: false, foreign_key: { to_table: :users }
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :relationship, null: false, default: "parent"
      t.string :status, null: false, default: "active"
      t.timestamps
    end

    add_index :guardian_links, [:tenant_id, :guardian_id, :student_id], unique: true
  end
end
```

Model `apps/core/app/models/guardian_link.rb`:
- `include TenantScoped`
- `belongs_to :guardian, class_name: "User"`
- `belongs_to :student, class_name: "User"`
- Validates relationship inclusion in `%w[parent guardian other]`
- Validates status inclusion in `%w[active inactive]`
- Scope `active` — `where(status: "active")`

Update `apps/core/app/models/user.rb`:
- `has_many :guardian_links_as_guardian, class_name: "GuardianLink", foreign_key: :guardian_id`
- `has_many :guardian_links_as_student, class_name: "GuardianLink", foreign_key: :student_id`
- `has_many :wards, through: :guardian_links_as_guardian, source: :student`
- `has_many :guardians, through: :guardian_links_as_student, source: :guardian`

### 4. Create `question_versions` Table and Model

Migration:
```ruby
class CreateQuestionVersions < ActiveRecord::Migration[8.0]
  def change
    create_table :question_versions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :question, null: false, foreign_key: true
      t.integer :version_number, null: false, default: 1
      t.string :question_type, null: false
      t.text :content, null: false
      t.jsonb :choices, null: false, default: []
      t.jsonb :correct_answer
      t.text :explanation
      t.decimal :points, precision: 8, scale: 2, default: 1.0
      t.jsonb :metadata, null: false, default: {}
      t.string :status, null: false, default: "draft"
      t.references :created_by, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_index :question_versions, [:question_id, :version_number], unique: true

    # Add current_version_id to questions (mirrors unit_plans pattern)
    add_reference :questions, :current_version, foreign_key: { to_table: :question_versions }
  end
end
```

Model `apps/core/app/models/question_version.rb`:
- `include TenantScoped`
- `belongs_to :question`
- `belongs_to :created_by, class_name: "User", optional: true`
- Validates version_number uniqueness scoped to question_id

Update `apps/core/app/models/question.rb`:
- `has_many :question_versions`
- `belongs_to :current_version, class_name: "QuestionVersion", optional: true`
- `def create_version!` — duplicates current content into new version

### 5. Create Serializers

- `PermissionSerializer` — id, role_id, resource, action, granted
- `GuardianLinkSerializer` — id, guardian (nested user), student (nested user), relationship, status
- `QuestionVersionSerializer` — id, version_number, question_type, content, choices, correct_answer, points, status, created_at

### 6. Create Policies

- `PermissionPolicy` — admin only for CRUD
- `GuardianLinkPolicy` — admin can manage; guardian can read own links
- `QuestionVersionPolicy` — follows QuestionPolicy; teachers can create versions for owned banks

### 7. Create API Endpoints

Add routes:
```ruby
resources :permissions, only: [:index, :create, :update, :destroy]
resources :guardian_links, only: [:index, :create, :destroy]
# question_versions nested under questions
resources :questions do
  resources :question_versions, only: [:index, :show, :create]
  post :create_version, on: :member
end
```

### 8. Add Tests

For each new model:
- Model spec (validations, associations, scoping)
- Policy spec (role-based access)
- Request spec (CRUD endpoints)
- Factory (FactoryBot)

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_permissions.rb` | Permissions table |
| `apps/core/db/migrate/YYYYMMDD_create_guardian_links.rb` | Guardian links table |
| `apps/core/db/migrate/YYYYMMDD_create_question_versions.rb` | Question versions table |
| `apps/core/app/models/permission.rb` | Permission model |
| `apps/core/app/models/guardian_link.rb` | Guardian link model |
| `apps/core/app/models/question_version.rb` | Question version model |
| `apps/core/app/policies/concerns/permission_checkable.rb` | Permission check concern |
| `apps/core/app/policies/permission_policy.rb` | Permission policy |
| `apps/core/app/policies/guardian_link_policy.rb` | Guardian link policy |
| `apps/core/app/policies/question_version_policy.rb` | Question version policy |
| `apps/core/app/serializers/permission_serializer.rb` | Permission serializer |
| `apps/core/app/serializers/guardian_link_serializer.rb` | Guardian link serializer |
| `apps/core/app/serializers/question_version_serializer.rb` | Question version serializer |
| `apps/core/app/controllers/api/v1/permissions_controller.rb` | Permissions CRUD |
| `apps/core/app/controllers/api/v1/guardian_links_controller.rb` | Guardian links CRUD |
| `apps/core/app/controllers/api/v1/question_versions_controller.rb` | Question versions |
| `apps/core/spec/models/permission_spec.rb` | Model spec |
| `apps/core/spec/models/guardian_link_spec.rb` | Model spec |
| `apps/core/spec/models/question_version_spec.rb` | Model spec |
| `apps/core/spec/policies/permission_policy_spec.rb` | Policy spec |
| `apps/core/spec/policies/guardian_link_policy_spec.rb` | Policy spec |
| `apps/core/spec/policies/question_version_policy_spec.rb` | Policy spec |
| `apps/core/spec/requests/api/v1/permissions_controller_spec.rb` | Request spec |
| `apps/core/spec/requests/api/v1/guardian_links_controller_spec.rb` | Request spec |
| `apps/core/spec/requests/api/v1/question_versions_controller_spec.rb` | Request spec |
| `apps/core/spec/factories/permissions.rb` | Factory |
| `apps/core/spec/factories/guardian_links.rb` | Factory |
| `apps/core/spec/factories/question_versions.rb` | Factory |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/models/user.rb` | Add guardian associations |
| `apps/core/app/models/question.rb` | Add version associations |
| `apps/core/app/policies/application_policy.rb` | Include PermissionCheckable |
| `apps/core/config/routes.rb` | Add new resource routes |

---

## Definition of Done

- [ ] `permissions`, `guardian_links`, `question_versions` tables exist with tenant_id
- [ ] All 3 models include TenantScoped and have complete validations
- [ ] PermissionCheckable concern integrated into ApplicationPolicy
- [ ] User model has guardian link associations (wards, guardians)
- [ ] Question model has version associations with create_version! method
- [ ] All API endpoints functional with proper authorization
- [ ] All model, policy, and request specs pass
- [ ] `bundle exec rspec` passes with 0 failures
- [ ] No Rubocop violations
- [ ] `docs/TRACEABILITY.md` updated for TECH-2.4
