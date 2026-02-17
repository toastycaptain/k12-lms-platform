# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_17_000009) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "academic_years", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "current", default: false
    t.date "end_date", null: false
    t.string "name", null: false
    t.date "start_date", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_academic_years_on_tenant_id"
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "ai_invocations", force: :cascade do |t|
    t.bigint "ai_provider_config_id", null: false
    t.bigint "ai_task_policy_id"
    t.bigint "ai_template_id"
    t.datetime "completed_at"
    t.integer "completion_tokens"
    t.jsonb "context", default: {}, null: false
    t.datetime "created_at", null: false
    t.integer "duration_ms"
    t.text "error_message"
    t.string "input_hash"
    t.string "model", null: false
    t.integer "prompt_tokens"
    t.string "provider_name", null: false
    t.datetime "started_at"
    t.string "status", default: "pending", null: false
    t.string "task_type", null: false
    t.bigint "tenant_id", null: false
    t.integer "total_tokens"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["ai_provider_config_id"], name: "index_ai_invocations_on_ai_provider_config_id"
    t.index ["ai_task_policy_id"], name: "index_ai_invocations_on_ai_task_policy_id"
    t.index ["ai_template_id"], name: "index_ai_invocations_on_ai_template_id"
    t.index ["tenant_id", "task_type", "created_at"], name: "index_ai_invocations_on_tenant_id_and_task_type_and_created_at"
    t.index ["tenant_id"], name: "index_ai_invocations_on_tenant_id"
    t.index ["user_id"], name: "index_ai_invocations_on_user_id"
  end

  create_table "ai_provider_configs", force: :cascade do |t|
    t.text "api_key"
    t.jsonb "available_models", default: [], null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "default_model", null: false
    t.string "display_name", null: false
    t.string "provider_name", null: false
    t.jsonb "settings", default: {}, null: false
    t.string "status", default: "inactive", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_ai_provider_configs_on_created_by_id"
    t.index ["tenant_id", "provider_name"], name: "index_ai_provider_configs_on_tenant_id_and_provider_name", unique: true
    t.index ["tenant_id"], name: "index_ai_provider_configs_on_tenant_id"
  end

  create_table "ai_task_policies", force: :cascade do |t|
    t.bigint "ai_provider_config_id", null: false
    t.jsonb "allowed_roles", default: [], null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.boolean "enabled", default: true, null: false
    t.integer "max_tokens_limit", default: 4096
    t.string "model_override"
    t.boolean "requires_approval", default: false, null: false
    t.jsonb "settings", default: {}, null: false
    t.string "task_type", null: false
    t.float "temperature_limit", default: 1.0
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ai_provider_config_id"], name: "index_ai_task_policies_on_ai_provider_config_id"
    t.index ["created_by_id"], name: "index_ai_task_policies_on_created_by_id"
    t.index ["tenant_id", "task_type"], name: "index_ai_task_policies_on_tenant_id_and_task_type", unique: true
    t.index ["tenant_id"], name: "index_ai_task_policies_on_tenant_id"
  end

  create_table "ai_templates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "name", null: false
    t.string "status", default: "draft", null: false
    t.text "system_prompt", null: false
    t.string "task_type", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.text "user_prompt_template", null: false
    t.jsonb "variables", default: [], null: false
    t.index ["created_by_id"], name: "index_ai_templates_on_created_by_id"
    t.index ["tenant_id", "task_type", "status"], name: "index_ai_templates_on_tenant_id_and_task_type_and_status"
    t.index ["tenant_id"], name: "index_ai_templates_on_tenant_id"
  end

  create_table "announcements", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "message", null: false
    t.boolean "pinned", default: false
    t.datetime "published_at"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id", "pinned", "published_at"], name: "idx_announcements_course_pinned_pub"
    t.index ["course_id"], name: "index_announcements_on_course_id"
    t.index ["created_by_id"], name: "index_announcements_on_created_by_id"
    t.index ["tenant_id"], name: "index_announcements_on_tenant_id"
  end

  create_table "approvals", force: :cascade do |t|
    t.bigint "approvable_id", null: false
    t.string "approvable_type", null: false
    t.text "comments"
    t.datetime "created_at", null: false
    t.bigint "requested_by_id", null: false
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.string "status", default: "pending", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["approvable_type", "approvable_id"], name: "index_approvals_on_approvable_type_and_approvable_id"
    t.index ["requested_by_id"], name: "index_approvals_on_requested_by_id"
    t.index ["reviewed_by_id"], name: "index_approvals_on_reviewed_by_id"
    t.index ["tenant_id", "status"], name: "idx_approvals_tenant_status"
    t.index ["tenant_id"], name: "index_approvals_on_tenant_id"
  end

  create_table "assignment_standards", force: :cascade do |t|
    t.bigint "assignment_id", null: false
    t.datetime "created_at", null: false
    t.bigint "standard_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["assignment_id", "standard_id"], name: "index_assignment_standards_on_assignment_id_and_standard_id", unique: true
    t.index ["assignment_id"], name: "index_assignment_standards_on_assignment_id"
    t.index ["standard_id"], name: "index_assignment_standards_on_standard_id"
    t.index ["tenant_id"], name: "index_assignment_standards_on_tenant_id"
  end

  create_table "assignments", force: :cascade do |t|
    t.boolean "allow_late_submission", default: true
    t.string "assignment_type", null: false
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.datetime "due_at"
    t.text "instructions"
    t.datetime "lock_at"
    t.decimal "points_possible"
    t.bigint "rubric_id"
    t.string "status", default: "draft", null: false
    t.text "submission_types", default: [], array: true
    t.integer "submissions_count", default: 0, null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "unlock_at"
    t.datetime "updated_at", null: false
    t.index ["course_id", "status"], name: "idx_assignments_course_status"
    t.index ["course_id"], name: "index_assignments_on_course_id"
    t.index ["created_by_id"], name: "index_assignments_on_created_by_id"
    t.index ["rubric_id"], name: "index_assignments_on_rubric_id"
    t.index ["tenant_id"], name: "index_assignments_on_tenant_id"
  end

  create_table "attempt_answers", force: :cascade do |t|
    t.jsonb "answer", default: {}, null: false
    t.datetime "created_at", null: false
    t.text "feedback"
    t.datetime "graded_at"
    t.bigint "graded_by_id"
    t.boolean "is_correct"
    t.decimal "points_awarded"
    t.bigint "question_id", null: false
    t.bigint "quiz_attempt_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["graded_by_id"], name: "index_attempt_answers_on_graded_by_id"
    t.index ["question_id"], name: "index_attempt_answers_on_question_id"
    t.index ["quiz_attempt_id", "question_id"], name: "idx_attempt_answers_unique", unique: true
    t.index ["quiz_attempt_id"], name: "index_attempt_answers_on_quiz_attempt_id"
    t.index ["tenant_id"], name: "index_attempt_answers_on_tenant_id"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.bigint "actor_id"
    t.bigint "auditable_id"
    t.string "auditable_type"
    t.datetime "created_at", null: false
    t.string "event_type", null: false
    t.string "ip_address"
    t.jsonb "metadata", default: {}, null: false
    t.string "request_id"
    t.bigint "tenant_id", null: false
    t.string "user_agent"
    t.index ["actor_id"], name: "index_audit_logs_on_actor_id"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_logs_on_auditable"
    t.index ["created_at"], name: "idx_audit_logs_created_at"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["event_type"], name: "index_audit_logs_on_event_type"
    t.index ["request_id"], name: "index_audit_logs_on_request_id"
    t.index ["tenant_id", "auditable_type", "auditable_id"], name: "index_audit_logs_on_tenant_and_auditable"
    t.index ["tenant_id", "created_at"], name: "index_audit_logs_on_tenant_id_and_created_at"
    t.index ["tenant_id", "event_type", "created_at"], name: "index_audit_logs_on_tenant_id_and_event_type_and_created_at"
    t.index ["tenant_id"], name: "index_audit_logs_on_tenant_id"
  end

  create_table "course_modules", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "position", default: 0, null: false
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "unlock_at"
    t.datetime "updated_at", null: false
    t.index ["course_id", "position"], name: "index_course_modules_on_course_id_and_position"
    t.index ["course_id"], name: "index_course_modules_on_course_id"
    t.index ["tenant_id"], name: "index_course_modules_on_tenant_id"
  end

  create_table "courses", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.integer "assignments_count", default: 0, null: false
    t.string "code"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "enrollments_count", default: 0, null: false
    t.string "name", null: false
    t.jsonb "settings", default: {}, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_courses_on_academic_year_id"
    t.index ["tenant_id"], name: "index_courses_on_tenant_id"
  end

  create_table "data_retention_policies", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.boolean "enabled", default: true, null: false
    t.string "entity_type", null: false
    t.string "name", null: false
    t.integer "retention_days", null: false
    t.jsonb "settings", default: {}, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_data_retention_policies_on_created_by_id"
    t.index ["tenant_id"], name: "index_data_retention_policies_on_tenant_id"
  end

  create_table "discussion_posts", force: :cascade do |t|
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "discussion_id", null: false
    t.bigint "parent_post_id"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_discussion_posts_on_created_by_id"
    t.index ["discussion_id"], name: "index_discussion_posts_on_discussion_id"
    t.index ["parent_post_id"], name: "index_discussion_posts_on_parent_post_id"
    t.index ["tenant_id"], name: "index_discussion_posts_on_tenant_id"
  end

  create_table "discussions", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.integer "discussion_posts_count", default: 0, null: false
    t.boolean "pinned", default: false
    t.boolean "require_initial_post", default: false
    t.string "status", default: "open", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_discussions_on_course_id"
    t.index ["created_by_id"], name: "index_discussions_on_created_by_id"
    t.index ["tenant_id"], name: "index_discussions_on_tenant_id"
  end

  create_table "enrollments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "role", null: false
    t.bigint "section_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["section_id"], name: "index_enrollments_on_section_id"
    t.index ["tenant_id"], name: "index_enrollments_on_tenant_id"
    t.index ["user_id", "section_id"], name: "idx_enrollments_user_section"
    t.index ["user_id", "section_id"], name: "index_enrollments_on_user_id_and_section_id", unique: true
    t.index ["user_id"], name: "index_enrollments_on_user_id"
  end

  create_table "guardian_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "guardian_id", null: false
    t.string "relationship", default: "parent", null: false
    t.string "status", default: "active", null: false
    t.bigint "student_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["guardian_id"], name: "index_guardian_links_on_guardian_id"
    t.index ["student_id"], name: "index_guardian_links_on_student_id"
    t.index ["tenant_id", "guardian_id", "student_id"], name: "idx_on_tenant_id_guardian_id_student_id_7dc4de2073", unique: true
    t.index ["tenant_id"], name: "index_guardian_links_on_tenant_id"
  end

  create_table "integration_configs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "provider", null: false
    t.jsonb "settings", default: {}, null: false
    t.string "status", default: "inactive", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_integration_configs_on_created_by_id"
    t.index ["tenant_id", "provider"], name: "index_integration_configs_on_tenant_id_and_provider", unique: true
    t.index ["tenant_id"], name: "index_integration_configs_on_tenant_id"
  end

  create_table "lesson_plans", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "current_version_id"
    t.integer "position", default: 0, null: false
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.bigint "unit_plan_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_lesson_plans_on_created_by_id"
    t.index ["current_version_id"], name: "idx_lesson_plans_current_version"
    t.index ["tenant_id"], name: "index_lesson_plans_on_tenant_id"
    t.index ["unit_plan_id", "position"], name: "idx_lesson_plans_unit_position"
    t.index ["unit_plan_id"], name: "index_lesson_plans_on_unit_plan_id"
  end

  create_table "lesson_versions", force: :cascade do |t|
    t.text "activities"
    t.datetime "created_at", null: false
    t.integer "duration_minutes"
    t.bigint "lesson_plan_id", null: false
    t.text "materials"
    t.text "objectives"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "version_number", null: false
    t.index ["lesson_plan_id", "version_number"], name: "index_lesson_versions_on_lesson_plan_id_and_version_number", unique: true
    t.index ["lesson_plan_id"], name: "index_lesson_versions_on_lesson_plan_id"
    t.index ["tenant_id"], name: "index_lesson_versions_on_tenant_id"
  end

  create_table "lti_registrations", force: :cascade do |t|
    t.string "auth_login_url", null: false
    t.string "auth_token_url", null: false
    t.string "client_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "deployment_id", null: false
    t.text "description"
    t.string "issuer", null: false
    t.string "jwks_url", null: false
    t.string "name", null: false
    t.jsonb "settings", default: {}, null: false
    t.string "status", default: "inactive", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_lti_registrations_on_created_by_id"
    t.index ["tenant_id", "client_id"], name: "idx_lti_registrations_tenant_client"
    t.index ["tenant_id"], name: "index_lti_registrations_on_tenant_id"
  end

  create_table "lti_resource_links", force: :cascade do |t|
    t.bigint "course_id"
    t.datetime "created_at", null: false
    t.jsonb "custom_params", default: {}, null: false
    t.text "description"
    t.bigint "lti_registration_id", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.index ["course_id"], name: "index_lti_resource_links_on_course_id"
    t.index ["lti_registration_id"], name: "index_lti_resource_links_on_lti_registration_id"
    t.index ["tenant_id"], name: "index_lti_resource_links_on_tenant_id"
  end

  create_table "message_thread_participants", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "last_read_at"
    t.bigint "message_thread_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["message_thread_id", "user_id"], name: "idx_thread_participants_unique", unique: true
    t.index ["message_thread_id"], name: "index_message_thread_participants_on_message_thread_id"
    t.index ["tenant_id"], name: "index_message_thread_participants_on_tenant_id"
    t.index ["user_id"], name: "index_message_thread_participants_on_user_id"
  end

  create_table "message_threads", force: :cascade do |t|
    t.bigint "course_id"
    t.datetime "created_at", null: false
    t.integer "messages_count", default: 0, null: false
    t.string "subject", null: false
    t.bigint "tenant_id", null: false
    t.string "thread_type", default: "direct", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_message_threads_on_course_id"
    t.index ["tenant_id", "thread_type"], name: "index_message_threads_on_tenant_id_and_thread_type"
    t.index ["tenant_id"], name: "index_message_threads_on_tenant_id"
  end

  create_table "messages", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.bigint "message_thread_id", null: false
    t.bigint "sender_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["message_thread_id", "created_at"], name: "index_messages_on_message_thread_id_and_created_at"
    t.index ["message_thread_id"], name: "index_messages_on_message_thread_id"
    t.index ["sender_id"], name: "index_messages_on_sender_id"
    t.index ["tenant_id"], name: "index_messages_on_tenant_id"
  end

  create_table "module_item_completions", force: :cascade do |t|
    t.datetime "completed_at", null: false
    t.datetime "created_at", null: false
    t.bigint "module_item_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["module_item_id"], name: "index_module_item_completions_on_module_item_id"
    t.index ["tenant_id"], name: "index_module_item_completions_on_tenant_id"
    t.index ["user_id", "module_item_id"], name: "index_module_item_completions_on_user_id_and_module_item_id", unique: true
    t.index ["user_id"], name: "index_module_item_completions_on_user_id"
  end

  create_table "module_items", force: :cascade do |t|
    t.bigint "course_module_id", null: false
    t.datetime "created_at", null: false
    t.string "item_type", null: false
    t.bigint "itemable_id"
    t.string "itemable_type"
    t.integer "position", default: 0, null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_module_id", "position"], name: "index_module_items_on_course_module_id_and_position"
    t.index ["course_module_id"], name: "index_module_items_on_course_module_id"
    t.index ["itemable_type", "itemable_id"], name: "index_module_items_on_itemable_type_and_itemable_id"
    t.index ["tenant_id"], name: "index_module_items_on_tenant_id"
  end

  create_table "notification_preferences", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "email", default: true, null: false
    t.string "email_frequency", default: "immediate", null: false
    t.string "event_type", null: false
    t.boolean "in_app", default: true, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["tenant_id"], name: "index_notification_preferences_on_tenant_id"
    t.index ["user_id", "event_type"], name: "idx_notification_prefs_user_event", unique: true
    t.index ["user_id"], name: "index_notification_preferences_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "actor_id"
    t.datetime "created_at", null: false
    t.text "message"
    t.jsonb "metadata", default: {}, null: false
    t.bigint "notifiable_id"
    t.string "notifiable_type"
    t.string "notification_type", null: false
    t.datetime "read_at"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.bigint "user_id", null: false
    t.index ["actor_id"], name: "index_notifications_on_actor_id"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["tenant_id"], name: "index_notifications_on_tenant_id"
    t.index ["user_id", "read_at"], name: "idx_notifications_user_read_at"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "permissions", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.boolean "granted", default: false, null: false
    t.string "resource", null: false
    t.bigint "role_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["role_id"], name: "index_permissions_on_role_id"
    t.index ["tenant_id", "role_id", "resource", "action"], name: "idx_permissions_unique", unique: true
    t.index ["tenant_id"], name: "index_permissions_on_tenant_id"
  end

  create_table "question_banks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.string "grade_level"
    t.jsonb "import_errors", default: []
    t.string "import_status"
    t.integer "questions_count", default: 0, null: false
    t.string "status", default: "active", null: false
    t.string "subject"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_question_banks_on_created_by_id"
    t.index ["tenant_id", "subject"], name: "idx_question_banks_tenant_subject"
    t.index ["tenant_id"], name: "index_question_banks_on_tenant_id"
  end

  create_table "question_versions", force: :cascade do |t|
    t.jsonb "choices", default: [], null: false
    t.text "content", null: false
    t.jsonb "correct_answer"
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.text "explanation"
    t.jsonb "metadata", default: {}, null: false
    t.decimal "points", precision: 8, scale: 2, default: "1.0", null: false
    t.bigint "question_id", null: false
    t.string "question_type", null: false
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version_number", default: 1, null: false
    t.index ["created_by_id"], name: "index_question_versions_on_created_by_id"
    t.index ["question_id", "version_number"], name: "index_question_versions_on_question_id_and_version_number", unique: true
    t.index ["question_id"], name: "index_question_versions_on_question_id"
    t.index ["tenant_id"], name: "index_question_versions_on_tenant_id"
  end

  create_table "questions", force: :cascade do |t|
    t.jsonb "choices", default: {}
    t.jsonb "correct_answer", default: {}
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "current_version_id"
    t.text "explanation"
    t.decimal "points", default: "1.0", null: false
    t.integer "position", default: 0, null: false
    t.text "prompt", null: false
    t.bigint "question_bank_id", null: false
    t.string "question_type", null: false
    t.string "status", default: "active", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_questions_on_created_by_id"
    t.index ["current_version_id"], name: "index_questions_on_current_version_id"
    t.index ["question_bank_id"], name: "index_questions_on_question_bank_id"
    t.index ["tenant_id"], name: "index_questions_on_tenant_id"
  end

  create_table "quiz_accommodations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "extra_attempts", default: 0, null: false
    t.integer "extra_time_minutes", default: 0, null: false
    t.text "notes"
    t.bigint "quiz_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["quiz_id", "user_id"], name: "index_quiz_accommodations_on_quiz_id_and_user_id", unique: true
    t.index ["quiz_id"], name: "index_quiz_accommodations_on_quiz_id"
    t.index ["tenant_id"], name: "index_quiz_accommodations_on_tenant_id"
    t.index ["user_id"], name: "index_quiz_accommodations_on_user_id"
  end

  create_table "quiz_attempts", force: :cascade do |t|
    t.integer "attempt_number", default: 1, null: false
    t.datetime "created_at", null: false
    t.decimal "percentage"
    t.bigint "quiz_id", null: false
    t.decimal "score"
    t.datetime "started_at", null: false
    t.string "status", default: "in_progress", null: false
    t.datetime "submitted_at"
    t.bigint "tenant_id", null: false
    t.integer "time_spent_seconds"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["quiz_id", "user_id", "attempt_number"], name: "idx_quiz_attempts_unique", unique: true
    t.index ["quiz_id"], name: "index_quiz_attempts_on_quiz_id"
    t.index ["tenant_id"], name: "index_quiz_attempts_on_tenant_id"
    t.index ["user_id", "quiz_id"], name: "idx_quiz_attempts_user_quiz"
    t.index ["user_id"], name: "index_quiz_attempts_on_user_id"
  end

  create_table "quiz_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "points", default: "1.0", null: false
    t.integer "position", default: 0, null: false
    t.bigint "question_id", null: false
    t.bigint "quiz_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["question_id"], name: "index_quiz_items_on_question_id"
    t.index ["quiz_id", "question_id"], name: "index_quiz_items_on_quiz_id_and_question_id", unique: true
    t.index ["quiz_id"], name: "index_quiz_items_on_quiz_id"
    t.index ["tenant_id"], name: "index_quiz_items_on_tenant_id"
  end

  create_table "quizzes", force: :cascade do |t|
    t.integer "attempts_allowed", default: 1, null: false
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.datetime "due_at"
    t.text "instructions"
    t.datetime "lock_at"
    t.decimal "points_possible"
    t.integer "quiz_attempts_count", default: 0, null: false
    t.string "quiz_type", default: "standard", null: false
    t.string "show_results", default: "after_submit", null: false
    t.boolean "shuffle_choices", default: false, null: false
    t.boolean "shuffle_questions", default: false, null: false
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.integer "time_limit_minutes"
    t.string "title", null: false
    t.datetime "unlock_at"
    t.datetime "updated_at", null: false
    t.index ["course_id", "status"], name: "idx_quizzes_course_status"
    t.index ["course_id"], name: "index_quizzes_on_course_id"
    t.index ["created_by_id"], name: "index_quizzes_on_created_by_id"
    t.index ["tenant_id"], name: "index_quizzes_on_tenant_id"
  end

  create_table "resource_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "drive_file_id"
    t.string "link_type", default: "reference", null: false
    t.bigint "linkable_id", null: false
    t.string "linkable_type", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "mime_type"
    t.string "provider", default: "url", null: false
    t.bigint "tenant_id", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["drive_file_id"], name: "idx_resource_links_drive_file_id", where: "(drive_file_id IS NOT NULL)"
    t.index ["linkable_type", "linkable_id", "link_type"], name: "idx_resource_links_linkable_type_kind"
    t.index ["linkable_type", "linkable_id"], name: "index_resource_links_on_linkable"
    t.index ["tenant_id"], name: "index_resource_links_on_tenant_id"
  end

  create_table "roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "name"], name: "index_roles_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_roles_on_tenant_id"
  end

  create_table "rubric_criteria", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.decimal "points", null: false
    t.integer "position", default: 0
    t.bigint "rubric_id", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["rubric_id"], name: "index_rubric_criteria_on_rubric_id"
    t.index ["tenant_id"], name: "index_rubric_criteria_on_tenant_id"
  end

  create_table "rubric_ratings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description", null: false
    t.decimal "points", null: false
    t.integer "position", default: 0
    t.bigint "rubric_criterion_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["rubric_criterion_id"], name: "index_rubric_ratings_on_rubric_criterion_id"
    t.index ["tenant_id"], name: "index_rubric_ratings_on_tenant_id"
  end

  create_table "rubric_scores", force: :cascade do |t|
    t.text "comments"
    t.datetime "created_at", null: false
    t.decimal "points_awarded", null: false
    t.bigint "rubric_criterion_id", null: false
    t.bigint "rubric_rating_id"
    t.bigint "submission_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["rubric_criterion_id"], name: "index_rubric_scores_on_rubric_criterion_id"
    t.index ["rubric_rating_id"], name: "index_rubric_scores_on_rubric_rating_id"
    t.index ["submission_id", "rubric_criterion_id"], name: "idx_rubric_scores_sub_crit_unique", unique: true
    t.index ["submission_id"], name: "index_rubric_scores_on_submission_id"
    t.index ["tenant_id"], name: "index_rubric_scores_on_tenant_id"
  end

  create_table "rubrics", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.decimal "points_possible"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_rubrics_on_created_by_id"
    t.index ["tenant_id"], name: "index_rubrics_on_tenant_id"
  end

  create_table "schools", force: :cascade do |t|
    t.text "address"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "tenant_id", null: false
    t.string "timezone"
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_schools_on_tenant_id"
  end

  create_table "sections", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "tenant_id", null: false
    t.bigint "term_id", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_sections_on_course_id"
    t.index ["tenant_id"], name: "index_sections_on_tenant_id"
    t.index ["term_id"], name: "index_sections_on_term_id"
  end

  create_table "standard_frameworks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "jurisdiction"
    t.string "name", null: false
    t.string "subject"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.string "version"
    t.index ["tenant_id"], name: "index_standard_frameworks_on_tenant_id"
  end

  create_table "standards", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "grade_band"
    t.bigint "parent_id"
    t.bigint "standard_framework_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_standards_on_parent_id"
    t.index ["standard_framework_id", "code"], name: "idx_standards_framework_code", unique: true
    t.index ["standard_framework_id", "parent_id"], name: "idx_standards_framework_parent"
    t.index ["standard_framework_id"], name: "index_standards_on_standard_framework_id"
    t.index ["tenant_id"], name: "index_standards_on_tenant_id"
  end

  create_table "submissions", force: :cascade do |t|
    t.bigint "assignment_id", null: false
    t.integer "attempt_number", default: 1
    t.text "body"
    t.datetime "created_at", null: false
    t.text "feedback"
    t.decimal "grade"
    t.datetime "graded_at"
    t.bigint "graded_by_id"
    t.string "status", default: "draft", null: false
    t.string "submission_type"
    t.datetime "submitted_at"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.bigint "user_id", null: false
    t.index ["assignment_id", "status"], name: "idx_submissions_assignment_status"
    t.index ["assignment_id", "user_id"], name: "index_submissions_on_assignment_id_and_user_id", unique: true
    t.index ["assignment_id"], name: "index_submissions_on_assignment_id"
    t.index ["graded_by_id"], name: "index_submissions_on_graded_by_id"
    t.index ["tenant_id"], name: "index_submissions_on_tenant_id"
    t.index ["user_id", "assignment_id"], name: "idx_submissions_user_assignment"
    t.index ["user_id"], name: "index_submissions_on_user_id"
  end

  create_table "sync_logs", force: :cascade do |t|
    t.datetime "archived_at"
    t.datetime "created_at", null: false
    t.bigint "entity_id"
    t.string "entity_type"
    t.string "external_id"
    t.string "level", default: "info", null: false
    t.text "message", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "sync_run_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["sync_run_id", "level"], name: "idx_sync_logs_run_level"
    t.index ["sync_run_id"], name: "index_sync_logs_on_sync_run_id"
    t.index ["tenant_id"], name: "index_sync_logs_on_tenant_id"
  end

  create_table "sync_mappings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "external_id", null: false
    t.string "external_type", null: false
    t.bigint "integration_config_id", null: false
    t.datetime "last_synced_at"
    t.bigint "local_id", null: false
    t.string "local_type", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["integration_config_id", "external_type", "external_id"], name: "idx_sync_mappings_external_unique", unique: true
    t.index ["integration_config_id", "local_type", "local_id"], name: "idx_sync_mappings_local_unique", unique: true
    t.index ["integration_config_id"], name: "index_sync_mappings_on_integration_config_id"
    t.index ["tenant_id"], name: "index_sync_mappings_on_tenant_id"
  end

  create_table "sync_runs", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "direction", default: "push", null: false
    t.text "error_message"
    t.bigint "integration_config_id", null: false
    t.integer "records_failed", default: 0, null: false
    t.integer "records_processed", default: 0, null: false
    t.integer "records_succeeded", default: 0, null: false
    t.datetime "started_at"
    t.string "status", default: "pending", null: false
    t.string "sync_type", null: false
    t.bigint "tenant_id", null: false
    t.bigint "triggered_by_id"
    t.datetime "updated_at", null: false
    t.index ["integration_config_id", "sync_type", "created_at"], name: "idx_sync_runs_config_type_date"
    t.index ["integration_config_id"], name: "index_sync_runs_on_integration_config_id"
    t.index ["tenant_id"], name: "index_sync_runs_on_tenant_id"
    t.index ["triggered_by_id"], name: "index_sync_runs_on_triggered_by_id"
  end

  create_table "template_version_standards", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "standard_id", null: false
    t.bigint "template_version_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["standard_id"], name: "index_template_version_standards_on_standard_id"
    t.index ["template_version_id", "standard_id"], name: "idx_tmpl_ver_std_unique", unique: true
    t.index ["template_version_id"], name: "index_template_version_standards_on_template_version_id"
    t.index ["tenant_id"], name: "index_template_version_standards_on_tenant_id"
  end

  create_table "template_versions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.text "enduring_understandings", default: [], array: true
    t.text "essential_questions", default: [], array: true
    t.integer "suggested_duration_weeks"
    t.bigint "template_id", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "version_number", null: false
    t.index ["template_id", "version_number"], name: "index_template_versions_on_template_id_and_version_number", unique: true
    t.index ["template_id"], name: "index_template_versions_on_template_id"
    t.index ["tenant_id"], name: "index_template_versions_on_tenant_id"
  end

  create_table "templates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "current_version_id"
    t.text "description"
    t.string "grade_level"
    t.string "name", null: false
    t.string "status", default: "draft", null: false
    t.string "subject"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_templates_on_created_by_id"
    t.index ["tenant_id", "status"], name: "idx_templates_tenant_status"
    t.index ["tenant_id"], name: "index_templates_on_tenant_id"
  end

  create_table "tenants", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.jsonb "settings", default: {}
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_tenants_on_slug", unique: true
  end

  create_table "terms", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.string "name", null: false
    t.date "start_date", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_terms_on_academic_year_id"
    t.index ["tenant_id"], name: "index_terms_on_tenant_id"
  end

  create_table "unit_plans", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "current_version_id"
    t.date "end_date"
    t.date "start_date"
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_unit_plans_on_course_id"
    t.index ["created_by_id"], name: "index_unit_plans_on_created_by_id"
    t.index ["current_version_id"], name: "index_unit_plans_on_current_version_id"
    t.index ["tenant_id", "status"], name: "idx_unit_plans_tenant_status"
    t.index ["tenant_id"], name: "index_unit_plans_on_tenant_id"
  end

  create_table "unit_version_standards", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "standard_id", null: false
    t.bigint "tenant_id", null: false
    t.bigint "unit_version_id", null: false
    t.datetime "updated_at", null: false
    t.index ["standard_id"], name: "index_unit_version_standards_on_standard_id"
    t.index ["tenant_id"], name: "index_unit_version_standards_on_tenant_id"
    t.index ["unit_version_id", "standard_id"], name: "idx_on_unit_version_id_standard_id_9e61284b07", unique: true
    t.index ["unit_version_id"], name: "index_unit_version_standards_on_unit_version_id"
  end

  create_table "unit_versions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.text "enduring_understandings", default: [], array: true
    t.text "essential_questions", default: [], array: true
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.bigint "unit_plan_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version_number", null: false
    t.index ["tenant_id"], name: "index_unit_versions_on_tenant_id"
    t.index ["unit_plan_id", "version_number"], name: "index_unit_versions_on_unit_plan_id_and_version_number", unique: true
    t.index ["unit_plan_id"], name: "index_unit_versions_on_unit_plan_id"
  end

  create_table "user_roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "role_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["role_id"], name: "index_user_roles_on_role_id"
    t.index ["tenant_id"], name: "index_user_roles_on_tenant_id"
    t.index ["user_id", "role_id"], name: "index_user_roles_on_user_id_and_role_id", unique: true
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "first_name"
    t.text "google_access_token"
    t.text "google_refresh_token"
    t.datetime "google_token_expires_at"
    t.string "last_name"
    t.boolean "onboarding_complete", default: false, null: false
    t.jsonb "preferences", default: {}, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "email"], name: "index_users_on_tenant_id_and_email", unique: true
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
  end

  add_foreign_key "academic_years", "tenants"
  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "ai_invocations", "ai_provider_configs"
  add_foreign_key "ai_invocations", "ai_task_policies"
  add_foreign_key "ai_invocations", "ai_templates"
  add_foreign_key "ai_invocations", "tenants"
  add_foreign_key "ai_invocations", "users"
  add_foreign_key "ai_provider_configs", "tenants"
  add_foreign_key "ai_provider_configs", "users", column: "created_by_id"
  add_foreign_key "ai_task_policies", "ai_provider_configs"
  add_foreign_key "ai_task_policies", "tenants"
  add_foreign_key "ai_task_policies", "users", column: "created_by_id"
  add_foreign_key "ai_templates", "tenants"
  add_foreign_key "ai_templates", "users", column: "created_by_id"
  add_foreign_key "announcements", "courses"
  add_foreign_key "announcements", "tenants"
  add_foreign_key "announcements", "users", column: "created_by_id"
  add_foreign_key "approvals", "tenants"
  add_foreign_key "approvals", "users", column: "requested_by_id"
  add_foreign_key "approvals", "users", column: "reviewed_by_id"
  add_foreign_key "assignment_standards", "assignments"
  add_foreign_key "assignment_standards", "standards"
  add_foreign_key "assignment_standards", "tenants"
  add_foreign_key "assignments", "courses"
  add_foreign_key "assignments", "rubrics"
  add_foreign_key "assignments", "tenants"
  add_foreign_key "assignments", "users", column: "created_by_id"
  add_foreign_key "attempt_answers", "questions"
  add_foreign_key "attempt_answers", "quiz_attempts"
  add_foreign_key "attempt_answers", "tenants"
  add_foreign_key "attempt_answers", "users", column: "graded_by_id"
  add_foreign_key "audit_logs", "tenants"
  add_foreign_key "audit_logs", "users", column: "actor_id"
  add_foreign_key "course_modules", "courses"
  add_foreign_key "course_modules", "tenants"
  add_foreign_key "courses", "academic_years"
  add_foreign_key "courses", "tenants"
  add_foreign_key "data_retention_policies", "tenants"
  add_foreign_key "data_retention_policies", "users", column: "created_by_id"
  add_foreign_key "discussion_posts", "discussion_posts", column: "parent_post_id"
  add_foreign_key "discussion_posts", "discussions"
  add_foreign_key "discussion_posts", "tenants"
  add_foreign_key "discussion_posts", "users", column: "created_by_id"
  add_foreign_key "discussions", "courses"
  add_foreign_key "discussions", "tenants"
  add_foreign_key "discussions", "users", column: "created_by_id"
  add_foreign_key "enrollments", "sections"
  add_foreign_key "enrollments", "tenants"
  add_foreign_key "enrollments", "users"
  add_foreign_key "guardian_links", "tenants"
  add_foreign_key "guardian_links", "users", column: "guardian_id"
  add_foreign_key "guardian_links", "users", column: "student_id"
  add_foreign_key "integration_configs", "tenants"
  add_foreign_key "integration_configs", "users", column: "created_by_id"
  add_foreign_key "lesson_plans", "lesson_versions", column: "current_version_id"
  add_foreign_key "lesson_plans", "tenants"
  add_foreign_key "lesson_plans", "unit_plans"
  add_foreign_key "lesson_plans", "users", column: "created_by_id"
  add_foreign_key "lesson_versions", "lesson_plans"
  add_foreign_key "lesson_versions", "tenants"
  add_foreign_key "lti_registrations", "tenants"
  add_foreign_key "lti_registrations", "users", column: "created_by_id"
  add_foreign_key "lti_resource_links", "courses"
  add_foreign_key "lti_resource_links", "lti_registrations"
  add_foreign_key "lti_resource_links", "tenants"
  add_foreign_key "message_thread_participants", "message_threads"
  add_foreign_key "message_thread_participants", "tenants"
  add_foreign_key "message_thread_participants", "users"
  add_foreign_key "message_threads", "courses"
  add_foreign_key "message_threads", "tenants"
  add_foreign_key "messages", "message_threads"
  add_foreign_key "messages", "tenants"
  add_foreign_key "messages", "users", column: "sender_id"
  add_foreign_key "module_item_completions", "module_items"
  add_foreign_key "module_item_completions", "tenants"
  add_foreign_key "module_item_completions", "users"
  add_foreign_key "module_items", "course_modules"
  add_foreign_key "module_items", "tenants"
  add_foreign_key "notification_preferences", "tenants"
  add_foreign_key "notification_preferences", "users"
  add_foreign_key "notifications", "tenants"
  add_foreign_key "notifications", "users"
  add_foreign_key "notifications", "users", column: "actor_id"
  add_foreign_key "permissions", "roles"
  add_foreign_key "permissions", "tenants"
  add_foreign_key "question_banks", "tenants"
  add_foreign_key "question_banks", "users", column: "created_by_id"
  add_foreign_key "question_versions", "questions"
  add_foreign_key "question_versions", "tenants"
  add_foreign_key "question_versions", "users", column: "created_by_id"
  add_foreign_key "questions", "question_banks"
  add_foreign_key "questions", "question_versions", column: "current_version_id", on_delete: :nullify
  add_foreign_key "questions", "tenants"
  add_foreign_key "questions", "users", column: "created_by_id"
  add_foreign_key "quiz_accommodations", "quizzes"
  add_foreign_key "quiz_accommodations", "tenants"
  add_foreign_key "quiz_accommodations", "users"
  add_foreign_key "quiz_attempts", "quizzes"
  add_foreign_key "quiz_attempts", "tenants"
  add_foreign_key "quiz_attempts", "users"
  add_foreign_key "quiz_items", "questions"
  add_foreign_key "quiz_items", "quizzes"
  add_foreign_key "quiz_items", "tenants"
  add_foreign_key "quizzes", "courses"
  add_foreign_key "quizzes", "tenants"
  add_foreign_key "quizzes", "users", column: "created_by_id"
  add_foreign_key "resource_links", "tenants"
  add_foreign_key "roles", "tenants"
  add_foreign_key "rubric_criteria", "rubrics"
  add_foreign_key "rubric_criteria", "tenants"
  add_foreign_key "rubric_ratings", "rubric_criteria"
  add_foreign_key "rubric_ratings", "tenants"
  add_foreign_key "rubric_scores", "rubric_criteria"
  add_foreign_key "rubric_scores", "rubric_ratings"
  add_foreign_key "rubric_scores", "submissions"
  add_foreign_key "rubric_scores", "tenants"
  add_foreign_key "rubrics", "tenants"
  add_foreign_key "rubrics", "users", column: "created_by_id"
  add_foreign_key "schools", "tenants"
  add_foreign_key "sections", "courses"
  add_foreign_key "sections", "tenants"
  add_foreign_key "sections", "terms"
  add_foreign_key "standard_frameworks", "tenants"
  add_foreign_key "standards", "standard_frameworks"
  add_foreign_key "standards", "standards", column: "parent_id"
  add_foreign_key "standards", "tenants"
  add_foreign_key "submissions", "assignments"
  add_foreign_key "submissions", "tenants"
  add_foreign_key "submissions", "users"
  add_foreign_key "submissions", "users", column: "graded_by_id"
  add_foreign_key "sync_logs", "sync_runs"
  add_foreign_key "sync_logs", "tenants"
  add_foreign_key "sync_mappings", "integration_configs"
  add_foreign_key "sync_mappings", "tenants"
  add_foreign_key "sync_runs", "integration_configs"
  add_foreign_key "sync_runs", "tenants"
  add_foreign_key "sync_runs", "users", column: "triggered_by_id"
  add_foreign_key "template_version_standards", "standards"
  add_foreign_key "template_version_standards", "template_versions"
  add_foreign_key "template_version_standards", "tenants"
  add_foreign_key "template_versions", "templates"
  add_foreign_key "template_versions", "tenants"
  add_foreign_key "templates", "template_versions", column: "current_version_id"
  add_foreign_key "templates", "tenants"
  add_foreign_key "templates", "users", column: "created_by_id"
  add_foreign_key "terms", "academic_years"
  add_foreign_key "terms", "tenants"
  add_foreign_key "unit_plans", "courses"
  add_foreign_key "unit_plans", "tenants"
  add_foreign_key "unit_plans", "unit_versions", column: "current_version_id"
  add_foreign_key "unit_plans", "users", column: "created_by_id"
  add_foreign_key "unit_version_standards", "standards"
  add_foreign_key "unit_version_standards", "tenants"
  add_foreign_key "unit_version_standards", "unit_versions"
  add_foreign_key "unit_versions", "tenants"
  add_foreign_key "unit_versions", "unit_plans"
  add_foreign_key "user_roles", "roles"
  add_foreign_key "user_roles", "tenants"
  add_foreign_key "user_roles", "users"
  add_foreign_key "users", "tenants"
end
