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

ActiveRecord::Schema[8.1].define(version: 2026_03_07_120100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pg_stat_statements"

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

  create_table "alert_configurations", force: :cascade do |t|
    t.string "comparison", null: false
    t.integer "cooldown_minutes", default: 30, null: false
    t.datetime "created_at", null: false
    t.boolean "enabled", default: true, null: false
    t.datetime "last_triggered_at"
    t.string "metric", null: false
    t.string "name", null: false
    t.string "notification_channel", default: "slack", null: false
    t.string "notification_target"
    t.string "severity", default: "warning", null: false
    t.bigint "tenant_id"
    t.float "threshold", null: false
    t.integer "trigger_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["enabled", "metric"], name: "index_alert_configurations_on_enabled_and_metric"
    t.index ["metric"], name: "index_alert_configurations_on_metric"
    t.index ["tenant_id"], name: "index_alert_configurations_on_tenant_id"
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
    t.bigint "grade_category_id"
    t.text "instructions"
    t.datetime "lock_at"
    t.decimal "points_possible"
    t.bigint "rubric_id"
    t.tsvector "search_vector"
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
    t.index ["grade_category_id"], name: "index_assignments_on_grade_category_id"
    t.index ["rubric_id"], name: "index_assignments_on_rubric_id"
    t.index ["search_vector"], name: "index_assignments_on_search_vector", using: :gin
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

  create_table "attendances", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.date "occurred_on", null: false
    t.bigint "recorded_by_id"
    t.bigint "section_id", null: false
    t.string "status", default: "present", null: false
    t.bigint "student_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["recorded_by_id"], name: "index_attendances_on_recorded_by_id"
    t.index ["section_id"], name: "index_attendances_on_section_id"
    t.index ["student_id"], name: "index_attendances_on_student_id"
    t.index ["tenant_id", "section_id", "occurred_on"], name: "idx_attendance_section_day"
    t.index ["tenant_id", "student_id", "occurred_on"], name: "idx_attendance_student_day"
    t.index ["tenant_id", "student_id", "section_id", "occurred_on"], name: "idx_attendance_unique_student_section_day", unique: true
    t.index ["tenant_id"], name: "index_attendances_on_tenant_id"
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

  create_table "backup_records", force: :cascade do |t|
    t.string "backup_type", default: "full", null: false
    t.datetime "created_at", null: false
    t.integer "duration_seconds"
    t.string "error_message"
    t.jsonb "metadata", default: {}, null: false
    t.string "s3_bucket", null: false
    t.string "s3_key", null: false
    t.bigint "size_bytes"
    t.string "status", default: "in_progress", null: false
    t.datetime "updated_at", null: false
    t.jsonb "verification_result", default: {}, null: false
    t.datetime "verified_at"
    t.index ["backup_type", "status"], name: "index_backup_records_on_backup_type_and_status"
    t.index ["created_at"], name: "index_backup_records_on_created_at"
    t.index ["status"], name: "index_backup_records_on_status"
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
    t.bigint "school_id"
    t.tsvector "search_vector"
    t.jsonb "settings", default: {}, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_courses_on_academic_year_id"
    t.index ["school_id"], name: "index_courses_on_school_id"
    t.index ["search_vector"], name: "index_courses_on_search_vector", using: :gin
    t.index ["tenant_id"], name: "index_courses_on_tenant_id"
  end

  create_table "curriculum_course_mapping_issues", force: :cascade do |t|
    t.jsonb "candidate_school_ids", default: [], null: false
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "reason", default: "missing_school_id", null: false
    t.datetime "resolved_at"
    t.bigint "resolved_by_id"
    t.bigint "resolved_school_id"
    t.string "status", default: "unresolved", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_curriculum_course_mapping_issues_on_course_id"
    t.index ["resolved_by_id"], name: "index_curriculum_course_mapping_issues_on_resolved_by_id"
    t.index ["resolved_school_id"], name: "index_curriculum_course_mapping_issues_on_resolved_school_id"
    t.index ["tenant_id", "course_id"], name: "idx_curriculum_course_mapping_issues_course", unique: true
    t.index ["tenant_id", "status", "created_at"], name: "idx_curriculum_course_mapping_issues_state"
    t.index ["tenant_id"], name: "index_curriculum_course_mapping_issues_on_tenant_id"
  end

  create_table "curriculum_document_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.integer "position", default: 0, null: false
    t.string "relationship_type", null: false
    t.bigint "source_document_id", null: false
    t.bigint "target_document_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["source_document_id", "target_document_id", "relationship_type"], name: "idx_curriculum_document_links_unique", unique: true
    t.index ["source_document_id"], name: "index_curriculum_document_links_on_source_document_id"
    t.index ["target_document_id"], name: "index_curriculum_document_links_on_target_document_id"
    t.index ["tenant_id", "source_document_id", "relationship_type", "position"], name: "idx_curriculum_document_links_source_rel_position"
    t.index ["tenant_id", "target_document_id"], name: "idx_curriculum_document_links_target"
    t.index ["tenant_id"], name: "index_curriculum_document_links_on_tenant_id"
    t.check_constraint "source_document_id <> target_document_id", name: "curriculum_document_links_not_self"
  end

  create_table "curriculum_document_version_alignments", force: :cascade do |t|
    t.string "alignment_type", default: "aligned", null: false
    t.datetime "created_at", null: false
    t.bigint "curriculum_document_version_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "standard_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["curriculum_document_version_id", "standard_id", "alignment_type"], name: "idx_curriculum_doc_version_alignments_unique", unique: true
    t.index ["curriculum_document_version_id"], name: "idx_on_curriculum_document_version_id_e937e5bd22"
    t.index ["standard_id"], name: "index_curriculum_document_version_alignments_on_standard_id"
    t.index ["tenant_id", "standard_id"], name: "idx_curriculum_doc_version_alignments_standard"
    t.index ["tenant_id"], name: "index_curriculum_document_version_alignments_on_tenant_id"
  end

  create_table "curriculum_document_versions", force: :cascade do |t|
    t.jsonb "content", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "curriculum_document_id", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "version_number", null: false
    t.index ["created_by_id"], name: "index_curriculum_document_versions_on_created_by_id"
    t.index ["curriculum_document_id", "version_number"], name: "idx_curriculum_document_versions_doc_version", unique: true
    t.index ["curriculum_document_id"], name: "index_curriculum_document_versions_on_curriculum_document_id"
    t.index ["tenant_id", "curriculum_document_id"], name: "idx_curriculum_document_versions_tenant_doc"
    t.index ["tenant_id"], name: "index_curriculum_document_versions_on_tenant_id"
  end

  create_table "curriculum_documents", force: :cascade do |t|
    t.bigint "academic_year_id"
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "current_version_id"
    t.string "document_type", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "pack_key", null: false
    t.string "pack_payload_checksum"
    t.string "pack_version", null: false
    t.bigint "planning_context_id", null: false
    t.string "schema_key", null: false
    t.bigint "school_id", null: false
    t.tsvector "search_vector"
    t.jsonb "settings", default: {}, null: false
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_curriculum_documents_on_academic_year_id"
    t.index ["created_by_id"], name: "index_curriculum_documents_on_created_by_id"
    t.index ["current_version_id"], name: "index_curriculum_documents_on_current_version_id"
    t.index ["planning_context_id"], name: "index_curriculum_documents_on_planning_context_id"
    t.index ["school_id"], name: "index_curriculum_documents_on_school_id"
    t.index ["search_vector"], name: "idx_curriculum_documents_search_vector", using: :gin
    t.index ["tenant_id", "document_type"], name: "idx_curriculum_documents_type"
    t.index ["tenant_id", "school_id", "planning_context_id"], name: "idx_curriculum_documents_school_context"
    t.index ["tenant_id"], name: "index_curriculum_documents_on_tenant_id"
  end

  create_table "curriculum_profile_assignments", force: :cascade do |t|
    t.bigint "academic_year_id"
    t.boolean "active", default: true, null: false
    t.bigint "assigned_by_id"
    t.bigint "course_id"
    t.datetime "created_at", null: false
    t.boolean "is_frozen", default: false, null: false
    t.jsonb "metadata", default: {}, null: false
    t.boolean "pinned", default: false, null: false
    t.string "profile_key", null: false
    t.string "profile_version"
    t.bigint "school_id"
    t.string "scope_type", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_curriculum_profile_assignments_on_academic_year_id"
    t.index ["assigned_by_id"], name: "index_curriculum_profile_assignments_on_assigned_by_id"
    t.index ["course_id"], name: "index_curriculum_profile_assignments_on_course_id"
    t.index ["school_id"], name: "index_curriculum_profile_assignments_on_school_id"
    t.index ["tenant_id", "academic_year_id", "is_frozen", "active"], name: "idx_curriculum_profile_assignments_freeze"
    t.index ["tenant_id", "course_id", "academic_year_id", "active"], name: "idx_curriculum_profile_assignments_course_year"
    t.index ["tenant_id", "school_id", "academic_year_id", "active"], name: "idx_curriculum_profile_assignments_school_year"
    t.index ["tenant_id", "scope_type", "active"], name: "idx_curriculum_profile_assignments_scope"
    t.index ["tenant_id"], name: "index_curriculum_profile_assignments_on_tenant_id"
  end

  create_table "curriculum_profile_releases", force: :cascade do |t|
    t.string "checksum"
    t.datetime "created_at", null: false
    t.datetime "deprecated_at"
    t.datetime "frozen_at"
    t.bigint "imported_by_id"
    t.jsonb "metadata", default: {}, null: false
    t.jsonb "payload", default: {}, null: false
    t.string "profile_key", null: false
    t.string "profile_version", null: false
    t.datetime "published_at"
    t.string "rolled_back_from_version"
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["imported_by_id"], name: "index_curriculum_profile_releases_on_imported_by_id"
    t.index ["tenant_id", "profile_key", "profile_version"], name: "idx_curriculum_profile_releases_identity", unique: true
    t.index ["tenant_id", "profile_key", "status"], name: "idx_curriculum_profile_releases_state"
    t.index ["tenant_id"], name: "index_curriculum_profile_releases_on_tenant_id"
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

  create_table "districts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.jsonb "settings", default: {}, null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_districts_on_slug", unique: true
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

  create_table "feature_flags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "enabled", default: false, null: false
    t.string "key", null: false
    t.bigint "tenant_id"
    t.datetime "updated_at", null: false
    t.index ["key", "tenant_id"], name: "index_feature_flags_on_key_and_tenant_id", unique: true
    t.index ["key"], name: "index_feature_flags_on_key"
    t.index ["tenant_id"], name: "index_feature_flags_on_tenant_id"
  end

  create_table "goals", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "progress_percent", default: 0, null: false
    t.string "status", default: "active", null: false
    t.bigint "student_id", null: false
    t.date "target_date"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["student_id"], name: "index_goals_on_student_id"
    t.index ["tenant_id", "student_id", "status"], name: "index_goals_on_tenant_id_and_student_id_and_status"
    t.index ["tenant_id"], name: "index_goals_on_tenant_id"
    t.check_constraint "progress_percent >= 0 AND progress_percent <= 100", name: "goals_progress_percent_range"
  end

  create_table "grade_categories", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.decimal "weight_percentage", precision: 5, scale: 2, default: "0.0", null: false
    t.index ["course_id"], name: "index_grade_categories_on_course_id"
    t.index ["tenant_id", "course_id", "name"], name: "index_grade_categories_on_tenant_id_and_course_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_grade_categories_on_tenant_id"
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

  create_table "ib_activity_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "dedupe_key"
    t.string "document_type"
    t.string "entity_ref"
    t.string "event_family", null: false
    t.string "event_name", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "occurred_at", null: false
    t.string "programme", default: "Mixed", null: false
    t.string "route_id"
    t.bigint "school_id"
    t.string "session_key"
    t.string "surface", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["school_id"], name: "index_ib_activity_events_on_school_id"
    t.index ["tenant_id", "dedupe_key"], name: "idx_ib_activity_events_dedupe", unique: true, where: "(dedupe_key IS NOT NULL)"
    t.index ["tenant_id", "event_family", "programme", "occurred_at"], name: "idx_ib_activity_events_family_programme"
    t.index ["tenant_id", "event_name", "occurred_at"], name: "idx_ib_activity_events_event_time"
    t.index ["tenant_id"], name: "index_ib_activity_events_on_tenant_id"
    t.index ["user_id", "occurred_at"], name: "idx_ib_activity_events_user_time"
    t.index ["user_id"], name: "index_ib_activity_events_on_user_id"
  end

  create_table "ib_collaboration_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "curriculum_document_id", null: false
    t.string "device_label"
    t.datetime "expires_at"
    t.datetime "last_seen_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "role", default: "editor", null: false
    t.bigint "school_id"
    t.string "scope_key", default: "root", null: false
    t.string "scope_type", default: "document", null: false
    t.string "session_key", null: false
    t.string "status", default: "active", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["curriculum_document_id", "status"], name: "idx_ib_collaboration_sessions_document_status"
    t.index ["curriculum_document_id"], name: "index_ib_collaboration_sessions_on_curriculum_document_id"
    t.index ["school_id"], name: "index_ib_collaboration_sessions_on_school_id"
    t.index ["tenant_id", "user_id", "session_key"], name: "idx_ib_collaboration_sessions_unique", unique: true
    t.index ["tenant_id"], name: "index_ib_collaboration_sessions_on_tenant_id"
    t.index ["user_id"], name: "index_ib_collaboration_sessions_on_user_id"
  end

  create_table "ib_communication_preferences", force: :cascade do |t|
    t.string "audience", default: "guardian", null: false
    t.datetime "created_at", null: false
    t.jsonb "delivery_rules", default: {}, null: false
    t.string "digest_cadence", default: "weekly_digest", null: false
    t.string "locale", default: "en", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "quiet_hours_end", default: "07:00", null: false
    t.string "quiet_hours_start", default: "20:00", null: false
    t.string "quiet_hours_timezone", default: "UTC", null: false
    t.bigint "school_id"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["school_id"], name: "index_ib_communication_preferences_on_school_id"
    t.index ["tenant_id", "school_id", "user_id", "audience"], name: "idx_ib_communication_preferences_scope", unique: true
    t.index ["tenant_id"], name: "index_ib_communication_preferences_on_tenant_id"
    t.index ["user_id"], name: "index_ib_communication_preferences_on_user_id"
  end

  create_table "ib_delivery_receipts", force: :cascade do |t|
    t.datetime "acknowledged_at"
    t.string "audience_role", default: "guardian", null: false
    t.datetime "created_at", null: false
    t.bigint "deliverable_id", null: false
    t.string "deliverable_type", null: false
    t.string "locale"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "read_at"
    t.bigint "school_id"
    t.string "state", default: "delivered", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["school_id"], name: "index_ib_delivery_receipts_on_school_id"
    t.index ["tenant_id", "user_id", "deliverable_type", "deliverable_id", "audience_role"], name: "idx_ib_delivery_receipts_unique", unique: true
    t.index ["tenant_id"], name: "index_ib_delivery_receipts_on_tenant_id"
    t.index ["user_id"], name: "index_ib_delivery_receipts_on_user_id"
  end

  create_table "ib_document_collaborators", force: :cascade do |t|
    t.bigint "assigned_by_id"
    t.string "contribution_mode", default: "full", null: false
    t.datetime "created_at", null: false
    t.bigint "curriculum_document_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "role", default: "co_planner", null: false
    t.string "status", default: "active", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["assigned_by_id"], name: "index_ib_document_collaborators_on_assigned_by_id"
    t.index ["curriculum_document_id", "user_id", "role"], name: "idx_ib_doc_collaborators_unique", unique: true
    t.index ["curriculum_document_id"], name: "index_ib_document_collaborators_on_curriculum_document_id"
    t.index ["tenant_id"], name: "index_ib_document_collaborators_on_tenant_id"
    t.index ["user_id"], name: "index_ib_document_collaborators_on_user_id"
  end

  create_table "ib_document_comments", force: :cascade do |t|
    t.string "anchor_path"
    t.bigint "author_id", null: false
    t.text "body", null: false
    t.string "comment_type", default: "general", null: false
    t.datetime "created_at", null: false
    t.bigint "curriculum_document_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "parent_comment_id"
    t.datetime "resolved_at"
    t.bigint "resolved_by_id"
    t.string "status", default: "open", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.string "visibility", default: "internal", null: false
    t.index ["author_id"], name: "index_ib_document_comments_on_author_id"
    t.index ["curriculum_document_id", "status"], name: "idx_ib_doc_comments_status"
    t.index ["curriculum_document_id"], name: "index_ib_document_comments_on_curriculum_document_id"
    t.index ["parent_comment_id"], name: "index_ib_document_comments_on_parent_comment_id"
    t.index ["resolved_by_id"], name: "index_ib_document_comments_on_resolved_by_id"
    t.index ["tenant_id"], name: "index_ib_document_comments_on_tenant_id"
  end

  create_table "ib_evidence_items", force: :cascade do |t|
    t.string "contributor_type", default: "teacher", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "curriculum_document_id"
    t.bigint "curriculum_document_version_id"
    t.jsonb "metadata", default: {}, null: false
    t.text "next_action"
    t.bigint "planning_context_id"
    t.string "programme", default: "PYP", null: false
    t.bigint "school_id", null: false
    t.string "status", default: "needs_validation", null: false
    t.text "story_draft"
    t.bigint "student_id"
    t.text "summary"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "visibility", default: "undecided", null: false
    t.index ["created_by_id"], name: "index_ib_evidence_items_on_created_by_id"
    t.index ["curriculum_document_id"], name: "index_ib_evidence_items_on_curriculum_document_id"
    t.index ["curriculum_document_version_id"], name: "index_ib_evidence_items_on_curriculum_document_version_id"
    t.index ["planning_context_id"], name: "index_ib_evidence_items_on_planning_context_id"
    t.index ["school_id", "created_by_id", "updated_at"], name: "idx_ib_evidence_items_creator_updated"
    t.index ["school_id", "planning_context_id", "updated_at"], name: "idx_ib_evidence_items_context_updated"
    t.index ["school_id", "programme", "status"], name: "idx_ib_evidence_items_queue"
    t.index ["school_id", "programme", "visibility"], name: "idx_ib_evidence_items_programme_visibility"
    t.index ["school_id"], name: "index_ib_evidence_items_on_school_id"
    t.index ["student_id"], name: "index_ib_evidence_items_on_student_id"
    t.index ["tenant_id"], name: "index_ib_evidence_items_on_tenant_id"
  end

  create_table "ib_import_batches", force: :cascade do |t|
    t.bigint "academic_year_id"
    t.boolean "coexistence_mode", default: false, null: false
    t.datetime "created_at", null: false
    t.jsonb "dry_run_summary", default: {}, null: false
    t.text "error_message"
    t.datetime "executed_at"
    t.bigint "executed_by_id"
    t.jsonb "execution_summary", default: {}, null: false
    t.datetime "failed_at"
    t.string "import_mode", default: "draft", null: false
    t.bigint "initiated_by_id"
    t.datetime "last_dry_run_at"
    t.jsonb "mapping_payload", default: {}, null: false
    t.jsonb "parser_warnings", default: [], null: false
    t.datetime "preview_generated_at"
    t.jsonb "preview_summary", default: {}, null: false
    t.string "programme", default: "Mixed", null: false
    t.text "raw_payload"
    t.jsonb "rollback_capabilities", default: {}, null: false
    t.jsonb "rollback_summary", default: {}, null: false
    t.datetime "rolled_back_at"
    t.bigint "school_id", null: false
    t.jsonb "scope_metadata", default: {}, null: false
    t.string "source_checksum"
    t.string "source_contract_version", default: "phase8.v1", null: false
    t.string "source_filename", null: false
    t.string "source_format", null: false
    t.string "source_kind", null: false
    t.string "source_system", default: "generic", null: false
    t.string "status", default: "uploaded", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.jsonb "validation_summary", default: {}, null: false
    t.index ["academic_year_id"], name: "index_ib_import_batches_on_academic_year_id"
    t.index ["executed_by_id"], name: "index_ib_import_batches_on_executed_by_id"
    t.index ["initiated_by_id"], name: "index_ib_import_batches_on_initiated_by_id"
    t.index ["school_id"], name: "index_ib_import_batches_on_school_id"
    t.index ["tenant_id", "school_id", "source_system", "status"], name: "idx_ib_import_batches_source_system"
    t.index ["tenant_id", "school_id", "status"], name: "index_ib_import_batches_on_scope_and_status"
    t.index ["tenant_id"], name: "index_ib_import_batches_on_tenant_id"
  end

  create_table "ib_import_rows", force: :cascade do |t|
    t.jsonb "conflict_payload", default: {}, null: false
    t.datetime "created_at", null: false
    t.string "data_loss_risk", default: "low", null: false
    t.string "duplicate_candidate_ref"
    t.string "entity_kind"
    t.jsonb "error_messages", default: [], null: false
    t.jsonb "execution_payload", default: {}, null: false
    t.bigint "ib_import_batch_id", null: false
    t.jsonb "mapping_payload", default: {}, null: false
    t.jsonb "normalized_payload", default: {}, null: false
    t.jsonb "resolution_payload", default: {}, null: false
    t.integer "row_index", null: false
    t.string "sheet_name"
    t.string "source_identifier"
    t.jsonb "source_payload", default: {}, null: false
    t.string "status", default: "staged", null: false
    t.string "target_entity_ref"
    t.bigint "tenant_id", null: false
    t.jsonb "unsupported_fields", default: [], null: false
    t.datetime "updated_at", null: false
    t.jsonb "warnings", default: [], null: false
    t.index ["ib_import_batch_id", "row_index"], name: "index_ib_import_rows_on_ib_import_batch_id_and_row_index", unique: true
    t.index ["ib_import_batch_id", "status"], name: "index_ib_import_rows_on_ib_import_batch_id_and_status"
    t.index ["ib_import_batch_id"], name: "index_ib_import_rows_on_ib_import_batch_id"
    t.index ["tenant_id"], name: "index_ib_import_rows_on_tenant_id"
  end

  create_table "ib_learning_stories", force: :cascade do |t|
    t.string "audience", default: "families", null: false
    t.string "cadence", default: "weekly_digest", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "curriculum_document_id"
    t.jsonb "metadata", default: {}, null: false
    t.bigint "planning_context_id"
    t.string "programme", default: "PYP", null: false
    t.datetime "published_at"
    t.bigint "school_id", null: false
    t.string "state", default: "draft", null: false
    t.text "summary"
    t.text "support_prompt"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_ib_learning_stories_on_created_by_id"
    t.index ["curriculum_document_id"], name: "index_ib_learning_stories_on_curriculum_document_id"
    t.index ["planning_context_id"], name: "index_ib_learning_stories_on_planning_context_id"
    t.index ["school_id", "programme", "updated_at"], name: "idx_ib_learning_stories_programme_updated"
    t.index ["school_id", "state"], name: "idx_ib_learning_stories_state"
    t.index ["school_id"], name: "index_ib_learning_stories_on_school_id"
    t.index ["tenant_id"], name: "index_ib_learning_stories_on_tenant_id"
  end

  create_table "ib_learning_story_blocks", force: :cascade do |t|
    t.string "block_type", default: "narrative", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.bigint "ib_learning_story_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.integer "position", default: 0, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_learning_story_id", "position"], name: "idx_ib_learning_story_blocks_position"
    t.index ["ib_learning_story_id"], name: "index_ib_learning_story_blocks_on_ib_learning_story_id"
    t.index ["tenant_id"], name: "index_ib_learning_story_blocks_on_tenant_id"
  end

  create_table "ib_learning_story_evidence_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "ib_evidence_item_id", null: false
    t.bigint "ib_learning_story_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_evidence_item_id"], name: "index_ib_learning_story_evidence_items_on_ib_evidence_item_id"
    t.index ["ib_learning_story_id", "ib_evidence_item_id"], name: "idx_ib_story_evidence_unique", unique: true
    t.index ["ib_learning_story_id"], name: "index_ib_learning_story_evidence_items_on_ib_learning_story_id"
    t.index ["tenant_id"], name: "index_ib_learning_story_evidence_items_on_tenant_id"
  end

  create_table "ib_learning_story_translations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "ib_learning_story_id", null: false
    t.string "locale", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "state", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.bigint "translated_by_id"
    t.text "translated_summary"
    t.text "translated_support_prompt"
    t.text "translated_title"
    t.datetime "updated_at", null: false
    t.index ["ib_learning_story_id", "locale"], name: "idx_ib_story_translations_story_locale", unique: true
    t.index ["ib_learning_story_id"], name: "index_ib_learning_story_translations_on_ib_learning_story_id"
    t.index ["tenant_id"], name: "index_ib_learning_story_translations_on_tenant_id"
    t.index ["translated_by_id"], name: "index_ib_learning_story_translations_on_translated_by_id"
  end

  create_table "ib_operational_checkpoints", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.date "due_on"
    t.bigint "ib_operational_record_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.integer "position", default: 0, null: false
    t.bigint "reviewer_id"
    t.string "status", default: "pending", null: false
    t.text "summary"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_operational_record_id", "position"], name: "idx_ib_operational_checkpoints_position"
    t.index ["ib_operational_record_id"], name: "index_ib_operational_checkpoints_on_ib_operational_record_id"
    t.index ["reviewer_id"], name: "index_ib_operational_checkpoints_on_reviewer_id"
    t.index ["tenant_id"], name: "index_ib_operational_checkpoints_on_tenant_id"
  end

  create_table "ib_operational_records", force: :cascade do |t|
    t.bigint "advisor_id"
    t.datetime "created_at", null: false
    t.bigint "curriculum_document_id"
    t.date "due_on"
    t.jsonb "metadata", default: {}, null: false
    t.text "next_action"
    t.bigint "owner_id"
    t.bigint "planning_context_id"
    t.string "priority", default: "normal", null: false
    t.string "programme", default: "PYP", null: false
    t.string "record_family", null: false
    t.string "risk_level", default: "healthy", null: false
    t.string "route_hint"
    t.bigint "school_id", null: false
    t.string "status", default: "draft", null: false
    t.bigint "student_id"
    t.string "subtype", null: false
    t.text "summary"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["advisor_id"], name: "index_ib_operational_records_on_advisor_id"
    t.index ["curriculum_document_id"], name: "index_ib_operational_records_on_curriculum_document_id"
    t.index ["owner_id"], name: "index_ib_operational_records_on_owner_id"
    t.index ["planning_context_id"], name: "index_ib_operational_records_on_planning_context_id"
    t.index ["school_id", "programme", "record_family"], name: "idx_ib_operational_records_programme_family"
    t.index ["school_id"], name: "index_ib_operational_records_on_school_id"
    t.index ["student_id"], name: "index_ib_operational_records_on_student_id"
    t.index ["tenant_id"], name: "index_ib_operational_records_on_tenant_id"
  end

  create_table "ib_pilot_setups", force: :cascade do |t|
    t.datetime "activated_at"
    t.jsonb "baseline_metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.jsonb "feature_flag_bundle", default: {}, null: false
    t.datetime "last_validated_at"
    t.jsonb "owner_assignments", default: {}, null: false
    t.datetime "paused_at"
    t.text "paused_reason"
    t.string "programme", default: "Mixed", null: false
    t.datetime "retired_at"
    t.bigint "school_id", null: false
    t.jsonb "setup_steps", default: {}, null: false
    t.string "status", default: "not_started", null: false
    t.jsonb "status_details", default: {}, null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "updated_by_id"
    t.index ["created_by_id"], name: "index_ib_pilot_setups_on_created_by_id"
    t.index ["school_id"], name: "index_ib_pilot_setups_on_school_id"
    t.index ["tenant_id", "school_id", "programme"], name: "index_ib_pilot_setups_on_scope", unique: true
    t.index ["tenant_id"], name: "index_ib_pilot_setups_on_tenant_id"
    t.index ["updated_by_id"], name: "index_ib_pilot_setups_on_updated_by_id"
  end

  create_table "ib_portfolio_collections", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.jsonb "filters", default: {}, null: false
    t.jsonb "item_refs", default: [], null: false
    t.jsonb "metadata", default: {}, null: false
    t.text "narrative_summary"
    t.bigint "school_id"
    t.string "shared_token"
    t.bigint "student_id", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "visibility", default: "private", null: false
    t.index ["created_by_id"], name: "index_ib_portfolio_collections_on_created_by_id"
    t.index ["school_id"], name: "index_ib_portfolio_collections_on_school_id"
    t.index ["shared_token"], name: "index_ib_portfolio_collections_on_shared_token", unique: true
    t.index ["student_id"], name: "index_ib_portfolio_collections_on_student_id"
    t.index ["tenant_id", "student_id", "title"], name: "idx_ib_portfolio_collections_student_title"
    t.index ["tenant_id"], name: "index_ib_portfolio_collections_on_tenant_id"
  end

  create_table "ib_programme_settings", force: :cascade do |t|
    t.string "cadence_mode", default: "weekly_digest", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "programme", default: "Mixed", null: false
    t.string "review_owner_role", default: "curriculum_lead", null: false
    t.bigint "school_id"
    t.bigint "tenant_id", null: false
    t.jsonb "thresholds", default: {}, null: false
    t.datetime "updated_at", null: false
    t.bigint "updated_by_id"
    t.index ["school_id"], name: "index_ib_programme_settings_on_school_id"
    t.index ["tenant_id", "school_id", "programme"], name: "idx_ib_programme_settings_scope", unique: true
    t.index ["tenant_id"], name: "index_ib_programme_settings_on_tenant_id"
    t.index ["updated_by_id"], name: "index_ib_programme_settings_on_updated_by_id"
  end

  create_table "ib_publishing_audits", force: :cascade do |t|
    t.bigint "changed_by_id"
    t.datetime "created_at", null: false
    t.jsonb "details", default: {}, null: false
    t.string "event_type", null: false
    t.bigint "ib_learning_story_id"
    t.bigint "ib_publishing_queue_item_id"
    t.bigint "school_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["changed_by_id"], name: "index_ib_publishing_audits_on_changed_by_id"
    t.index ["ib_learning_story_id"], name: "index_ib_publishing_audits_on_ib_learning_story_id"
    t.index ["ib_publishing_queue_item_id"], name: "index_ib_publishing_audits_on_ib_publishing_queue_item_id"
    t.index ["school_id"], name: "index_ib_publishing_audits_on_school_id"
    t.index ["tenant_id"], name: "index_ib_publishing_audits_on_tenant_id"
  end

  create_table "ib_publishing_queue_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.datetime "delivered_at"
    t.text "held_reason"
    t.bigint "ib_learning_story_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "scheduled_for"
    t.bigint "school_id", null: false
    t.string "state", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_ib_publishing_queue_items_on_created_by_id"
    t.index ["ib_learning_story_id"], name: "index_ib_publishing_queue_items_on_ib_learning_story_id"
    t.index ["school_id", "state"], name: "idx_ib_publishing_queue_state"
    t.index ["school_id", "updated_at"], name: "idx_ib_publishing_queue_items_updated"
    t.index ["school_id"], name: "index_ib_publishing_queue_items_on_school_id"
    t.index ["tenant_id"], name: "index_ib_publishing_queue_items_on_tenant_id"
  end

  create_table "ib_reflection_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "due_on"
    t.bigint "ib_evidence_item_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.text "prompt", null: false
    t.bigint "requested_by_id", null: false
    t.datetime "responded_at"
    t.text "response_excerpt"
    t.string "status", default: "requested", null: false
    t.bigint "student_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_evidence_item_id"], name: "index_ib_reflection_requests_on_ib_evidence_item_id"
    t.index ["requested_by_id"], name: "index_ib_reflection_requests_on_requested_by_id"
    t.index ["student_id"], name: "index_ib_reflection_requests_on_student_id"
    t.index ["tenant_id"], name: "index_ib_reflection_requests_on_tenant_id"
  end

  create_table "ib_release_baselines", force: :cascade do |t|
    t.datetime "certified_at"
    t.bigint "certified_by_id"
    t.jsonb "checklist", default: {}, null: false
    t.string "ci_status", default: "pending", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.jsonb "dependency_snapshot", default: {}, null: false
    t.jsonb "flag_snapshot", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "migration_status", default: "pending", null: false
    t.string "pack_key", null: false
    t.string "pack_version", null: false
    t.string "release_channel", default: "ib-ga-candidate", null: false
    t.datetime "rolled_back_at"
    t.bigint "school_id"
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.datetime "verified_at"
    t.index ["certified_by_id"], name: "index_ib_release_baselines_on_certified_by_id"
    t.index ["created_by_id"], name: "index_ib_release_baselines_on_created_by_id"
    t.index ["school_id"], name: "index_ib_release_baselines_on_school_id"
    t.index ["tenant_id", "school_id", "release_channel"], name: "idx_ib_release_baselines_scope", unique: true
    t.index ["tenant_id"], name: "index_ib_release_baselines_on_tenant_id"
  end

  create_table "ib_report_deliveries", force: :cascade do |t|
    t.datetime "acknowledged_at"
    t.string "audience_role", default: "guardian", null: false
    t.string "channel", default: "web", null: false
    t.datetime "created_at", null: false
    t.datetime "delivered_at"
    t.text "error_message"
    t.datetime "failed_at"
    t.bigint "ib_report_id", null: false
    t.bigint "ib_report_version_id"
    t.string "locale", default: "en", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "read_at"
    t.bigint "recipient_id"
    t.bigint "school_id"
    t.string "status", default: "queued", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_report_id", "recipient_id", "channel"], name: "idx_ib_report_deliveries_target"
    t.index ["ib_report_id"], name: "index_ib_report_deliveries_on_ib_report_id"
    t.index ["ib_report_version_id"], name: "index_ib_report_deliveries_on_ib_report_version_id"
    t.index ["recipient_id"], name: "index_ib_report_deliveries_on_recipient_id"
    t.index ["school_id"], name: "index_ib_report_deliveries_on_school_id"
    t.index ["tenant_id"], name: "index_ib_report_deliveries_on_tenant_id"
  end

  create_table "ib_report_versions", force: :cascade do |t|
    t.jsonb "content_payload", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "ib_report_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.jsonb "proofing_summary", default: {}, null: false
    t.jsonb "render_payload", default: {}, null: false
    t.datetime "rendered_at"
    t.datetime "signed_off_at"
    t.bigint "signed_off_by_id"
    t.string "status", default: "draft", null: false
    t.string "template_key", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version_number", null: false
    t.index ["ib_report_id", "version_number"], name: "idx_ib_report_versions_number", unique: true
    t.index ["ib_report_id"], name: "index_ib_report_versions_on_ib_report_id"
    t.index ["signed_off_by_id"], name: "index_ib_report_versions_on_signed_off_by_id"
    t.index ["tenant_id"], name: "index_ib_report_versions_on_tenant_id"
  end

  create_table "ib_reports", force: :cascade do |t|
    t.bigint "academic_year_id"
    t.string "audience", default: "internal", null: false
    t.bigint "author_id"
    t.datetime "created_at", null: false
    t.datetime "last_rendered_at"
    t.jsonb "metadata", default: {}, null: false
    t.string "programme", default: "Mixed", null: false
    t.jsonb "proofing_summary", default: {}, null: false
    t.datetime "released_at"
    t.string "report_family", null: false
    t.bigint "school_id"
    t.jsonb "source_refs", default: [], null: false
    t.string "status", default: "draft", null: false
    t.bigint "student_id"
    t.text "summary"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_ib_reports_on_academic_year_id"
    t.index ["author_id"], name: "index_ib_reports_on_author_id"
    t.index ["school_id"], name: "index_ib_reports_on_school_id"
    t.index ["student_id"], name: "index_ib_reports_on_student_id"
    t.index ["tenant_id", "school_id", "programme", "report_family"], name: "idx_ib_reports_scope_family"
    t.index ["tenant_id", "student_id", "status"], name: "idx_ib_reports_student_status"
    t.index ["tenant_id"], name: "index_ib_reports_on_tenant_id"
  end

  create_table "ib_saved_searches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "filters", default: {}, null: false
    t.datetime "last_run_at"
    t.string "lens_key", default: "custom", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "name", null: false
    t.string "query"
    t.bigint "school_id"
    t.string "scope_key", default: "ib", null: false
    t.string "share_token"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["school_id"], name: "index_ib_saved_searches_on_school_id"
    t.index ["share_token"], name: "index_ib_saved_searches_on_share_token", unique: true
    t.index ["tenant_id", "user_id", "scope_key"], name: "idx_ib_saved_searches_scope"
    t.index ["tenant_id"], name: "index_ib_saved_searches_on_tenant_id"
    t.index ["user_id"], name: "index_ib_saved_searches_on_user_id"
  end

  create_table "ib_specialist_library_items", force: :cascade do |t|
    t.jsonb "content", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "item_type", default: "resource", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "programme", default: "Mixed", null: false
    t.bigint "school_id"
    t.string "source_entity_ref"
    t.text "summary"
    t.jsonb "tags", default: [], null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_ib_specialist_library_items_on_created_by_id"
    t.index ["school_id"], name: "index_ib_specialist_library_items_on_school_id"
    t.index ["tenant_id", "school_id", "programme"], name: "idx_ib_specialist_library_scope"
    t.index ["tenant_id"], name: "index_ib_specialist_library_items_on_tenant_id"
  end

  create_table "ib_standards_cycles", force: :cascade do |t|
    t.bigint "academic_year_id"
    t.bigint "coordinator_id"
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "school_id", null: false
    t.string "status", default: "open", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_ib_standards_cycles_on_academic_year_id"
    t.index ["coordinator_id"], name: "index_ib_standards_cycles_on_coordinator_id"
    t.index ["school_id"], name: "index_ib_standards_cycles_on_school_id"
    t.index ["tenant_id"], name: "index_ib_standards_cycles_on_tenant_id"
  end

  create_table "ib_standards_exports", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error_message"
    t.datetime "finished_at"
    t.bigint "ib_standards_cycle_id"
    t.bigint "ib_standards_packet_id", null: false
    t.bigint "initiated_by_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "school_id", null: false
    t.jsonb "snapshot_payload", default: {}, null: false
    t.datetime "started_at"
    t.string "status", default: "queued", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_standards_cycle_id"], name: "index_ib_standards_exports_on_ib_standards_cycle_id"
    t.index ["ib_standards_packet_id"], name: "index_ib_standards_exports_on_ib_standards_packet_id"
    t.index ["initiated_by_id"], name: "index_ib_standards_exports_on_initiated_by_id"
    t.index ["school_id", "status"], name: "idx_ib_standards_exports_school_status"
    t.index ["school_id"], name: "index_ib_standards_exports_on_school_id"
    t.index ["tenant_id"], name: "index_ib_standards_exports_on_tenant_id"
  end

  create_table "ib_standards_packet_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "ib_standards_packet_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.text "relevance_note"
    t.string "review_state", default: "draft", null: false
    t.bigint "source_id", null: false
    t.string "source_type", null: false
    t.text "summary"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_standards_packet_id", "source_type", "source_id"], name: "idx_ib_standards_packet_items_source", unique: true
    t.index ["ib_standards_packet_id"], name: "index_ib_standards_packet_items_on_ib_standards_packet_id"
    t.index ["tenant_id"], name: "index_ib_standards_packet_items_on_tenant_id"
  end

  create_table "ib_standards_packets", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "evidence_strength", default: "emerging", null: false
    t.string "export_status", default: "not_ready", null: false
    t.bigint "ib_standards_cycle_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "owner_id"
    t.string "review_state", default: "draft", null: false
    t.bigint "reviewer_id"
    t.bigint "school_id", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["ib_standards_cycle_id", "code"], name: "idx_ib_standards_packets_cycle_code", unique: true
    t.index ["ib_standards_cycle_id"], name: "index_ib_standards_packets_on_ib_standards_cycle_id"
    t.index ["owner_id"], name: "index_ib_standards_packets_on_owner_id"
    t.index ["reviewer_id"], name: "index_ib_standards_packets_on_reviewer_id"
    t.index ["school_id"], name: "index_ib_standards_packets_on_school_id"
    t.index ["tenant_id"], name: "index_ib_standards_packets_on_tenant_id"
  end

  create_table "ib_user_workspace_preferences", force: :cascade do |t|
    t.string "context_key", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "preference_key", null: false
    t.bigint "school_id"
    t.string "scope_key", default: "global", null: false
    t.string "surface", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.jsonb "value", default: {}, null: false
    t.index ["school_id"], name: "index_ib_user_workspace_preferences_on_school_id"
    t.index ["tenant_id", "user_id", "surface", "context_key", "preference_key", "scope_key"], name: "idx_ib_workspace_preferences_scope", unique: true
    t.index ["tenant_id"], name: "index_ib_user_workspace_preferences_on_tenant_id"
    t.index ["user_id"], name: "index_ib_user_workspace_preferences_on_user_id"
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
    t.tsvector "search_vector"
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.bigint "unit_plan_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_lesson_plans_on_created_by_id"
    t.index ["current_version_id"], name: "idx_lesson_plans_current_version"
    t.index ["search_vector"], name: "index_lesson_plans_on_search_vector", using: :gin
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

  create_table "mobile_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.datetime "last_used_at"
    t.string "refresh_token_digest", null: false
    t.datetime "revoked_at"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.index ["expires_at"], name: "index_mobile_sessions_on_expires_at"
    t.index ["refresh_token_digest"], name: "index_mobile_sessions_on_refresh_token_digest", unique: true
    t.index ["tenant_id", "user_id"], name: "index_mobile_sessions_on_tenant_id_and_user_id"
    t.index ["tenant_id"], name: "index_mobile_sessions_on_tenant_id"
    t.index ["user_id"], name: "index_mobile_sessions_on_user_id"
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
    t.string "dedupe_key"
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
    t.index ["tenant_id", "user_id", "notification_type", "dedupe_key"], name: "index_notifications_on_dedupe_key", unique: true, where: "(dedupe_key IS NOT NULL)"
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

  create_table "planning_context_courses", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.bigint "planning_context_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_planning_context_courses_on_course_id"
    t.index ["planning_context_id", "course_id"], name: "idx_on_planning_context_id_course_id_5a7234ebbd", unique: true
    t.index ["planning_context_id"], name: "index_planning_context_courses_on_planning_context_id"
    t.index ["tenant_id", "course_id"], name: "index_planning_context_courses_on_tenant_id_and_course_id"
    t.index ["tenant_id"], name: "index_planning_context_courses_on_tenant_id"
  end

  create_table "planning_contexts", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.string "kind", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "name", null: false
    t.bigint "school_id", null: false
    t.jsonb "settings", default: {}, null: false
    t.string "status", default: "active", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_planning_contexts_on_academic_year_id"
    t.index ["created_by_id"], name: "index_planning_contexts_on_created_by_id"
    t.index ["school_id"], name: "index_planning_contexts_on_school_id"
    t.index ["tenant_id", "school_id", "academic_year_id", "kind"], name: "idx_planning_contexts_tenant_school_year_kind"
    t.index ["tenant_id"], name: "index_planning_contexts_on_tenant_id"
  end

  create_table "pyp_programme_of_inquiries", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.bigint "coordinator_id"
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "school_id", null: false
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_pyp_programme_of_inquiries_on_academic_year_id"
    t.index ["coordinator_id"], name: "index_pyp_programme_of_inquiries_on_coordinator_id"
    t.index ["school_id", "academic_year_id"], name: "idx_pyp_poi_school_year", unique: true
    t.index ["school_id"], name: "index_pyp_programme_of_inquiries_on_school_id"
    t.index ["tenant_id"], name: "index_pyp_programme_of_inquiries_on_tenant_id"
  end

  create_table "pyp_programme_of_inquiry_entries", force: :cascade do |t|
    t.text "central_idea"
    t.string "coherence_signal", default: "healthy", null: false
    t.datetime "created_at", null: false
    t.bigint "curriculum_document_id"
    t.jsonb "metadata", default: {}, null: false
    t.bigint "planning_context_id"
    t.bigint "pyp_programme_of_inquiry_id", null: false
    t.string "review_state", default: "draft", null: false
    t.jsonb "specialist_expectations", default: [], null: false
    t.bigint "tenant_id", null: false
    t.string "theme", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "year_level", null: false
    t.index ["curriculum_document_id"], name: "idx_on_curriculum_document_id_05ec9711a7"
    t.index ["planning_context_id"], name: "index_pyp_programme_of_inquiry_entries_on_planning_context_id"
    t.index ["pyp_programme_of_inquiry_id", "year_level", "theme"], name: "idx_pyp_poi_entries_unique", unique: true
    t.index ["pyp_programme_of_inquiry_id"], name: "idx_on_pyp_programme_of_inquiry_id_e3745d8838"
    t.index ["tenant_id"], name: "index_pyp_programme_of_inquiry_entries_on_tenant_id"
  end

  create_table "question_banks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.string "grade_level"
    t.jsonb "import_errors", default: []
    t.string "import_status"
    t.integer "questions_count", default: 0, null: false
    t.tsvector "search_vector"
    t.string "status", default: "active", null: false
    t.string "subject"
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_question_banks_on_created_by_id"
    t.index ["search_vector"], name: "index_question_banks_on_search_vector", using: :gin
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
    t.string "curriculum_profile_key"
    t.string "curriculum_profile_version"
    t.string "name", null: false
    t.bigint "tenant_id", null: false
    t.string "timezone"
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "curriculum_profile_key", "curriculum_profile_version"], name: "idx_schools_tenant_curriculum_profile_version"
    t.index ["tenant_id", "curriculum_profile_key"], name: "idx_schools_tenant_curriculum_profile"
    t.index ["tenant_id"], name: "index_schools_on_tenant_id"
  end

  create_table "section_meetings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.time "end_time", null: false
    t.string "location"
    t.bigint "section_id", null: false
    t.time "start_time", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.integer "weekday", null: false
    t.index ["section_id", "weekday", "start_time"], name: "idx_section_meetings_schedule"
    t.index ["section_id"], name: "index_section_meetings_on_section_id"
    t.index ["tenant_id"], name: "index_section_meetings_on_tenant_id"
    t.check_constraint "weekday >= 0 AND weekday <= 6", name: "section_meetings_weekday_range"
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
    t.string "framework_kind", default: "standard", null: false
    t.string "jurisdiction"
    t.string "key"
    t.jsonb "metadata", default: {}, null: false
    t.string "name", null: false
    t.string "status", default: "active", null: false
    t.string "subject"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.string "version"
    t.index ["tenant_id", "framework_kind"], name: "idx_standard_frameworks_tenant_kind"
    t.index ["tenant_id", "key"], name: "idx_standard_frameworks_tenant_key", unique: true, where: "(key IS NOT NULL)"
    t.index ["tenant_id"], name: "index_standard_frameworks_on_tenant_id"
  end

  create_table "standards", force: :cascade do |t|
    t.string "code"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "grade_band"
    t.string "identifier"
    t.string "kind", default: "standard", null: false
    t.string "label"
    t.jsonb "metadata", default: {}, null: false
    t.bigint "parent_id"
    t.tsvector "search_vector"
    t.bigint "standard_framework_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["parent_id"], name: "index_standards_on_parent_id"
    t.index ["search_vector"], name: "index_standards_on_search_vector", using: :gin
    t.index ["standard_framework_id", "code"], name: "idx_standards_framework_code", unique: true
    t.index ["standard_framework_id", "parent_id"], name: "idx_standards_framework_parent"
    t.index ["standard_framework_id"], name: "index_standards_on_standard_framework_id"
    t.index ["tenant_id", "kind"], name: "idx_standards_tenant_kind"
    t.index ["tenant_id", "standard_framework_id"], name: "idx_standards_tenant_framework"
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
    t.bigint "district_id"
    t.string "name", null: false
    t.jsonb "settings", default: {}
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["district_id"], name: "index_tenants_on_district_id"
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
    t.tsvector "search_vector"
    t.date "start_date"
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_unit_plans_on_course_id"
    t.index ["created_by_id"], name: "index_unit_plans_on_created_by_id"
    t.index ["current_version_id"], name: "index_unit_plans_on_current_version_id"
    t.index ["search_vector"], name: "index_unit_plans_on_search_vector", using: :gin
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
    t.boolean "district_admin", default: false, null: false
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
  add_foreign_key "alert_configurations", "tenants"
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
  add_foreign_key "assignments", "grade_categories"
  add_foreign_key "assignments", "rubrics"
  add_foreign_key "assignments", "tenants"
  add_foreign_key "assignments", "users", column: "created_by_id"
  add_foreign_key "attempt_answers", "questions"
  add_foreign_key "attempt_answers", "quiz_attempts"
  add_foreign_key "attempt_answers", "tenants"
  add_foreign_key "attempt_answers", "users", column: "graded_by_id"
  add_foreign_key "attendances", "sections"
  add_foreign_key "attendances", "tenants"
  add_foreign_key "attendances", "users", column: "recorded_by_id"
  add_foreign_key "attendances", "users", column: "student_id"
  add_foreign_key "audit_logs", "tenants"
  add_foreign_key "audit_logs", "users", column: "actor_id"
  add_foreign_key "course_modules", "courses"
  add_foreign_key "course_modules", "tenants"
  add_foreign_key "courses", "academic_years"
  add_foreign_key "courses", "schools"
  add_foreign_key "courses", "tenants"
  add_foreign_key "curriculum_course_mapping_issues", "courses"
  add_foreign_key "curriculum_course_mapping_issues", "schools", column: "resolved_school_id"
  add_foreign_key "curriculum_course_mapping_issues", "tenants"
  add_foreign_key "curriculum_course_mapping_issues", "users", column: "resolved_by_id"
  add_foreign_key "curriculum_document_links", "curriculum_documents", column: "source_document_id"
  add_foreign_key "curriculum_document_links", "curriculum_documents", column: "target_document_id"
  add_foreign_key "curriculum_document_links", "tenants"
  add_foreign_key "curriculum_document_version_alignments", "curriculum_document_versions"
  add_foreign_key "curriculum_document_version_alignments", "standards"
  add_foreign_key "curriculum_document_version_alignments", "tenants"
  add_foreign_key "curriculum_document_versions", "curriculum_documents"
  add_foreign_key "curriculum_document_versions", "tenants"
  add_foreign_key "curriculum_document_versions", "users", column: "created_by_id"
  add_foreign_key "curriculum_documents", "academic_years"
  add_foreign_key "curriculum_documents", "curriculum_document_versions", column: "current_version_id"
  add_foreign_key "curriculum_documents", "planning_contexts"
  add_foreign_key "curriculum_documents", "schools"
  add_foreign_key "curriculum_documents", "tenants"
  add_foreign_key "curriculum_documents", "users", column: "created_by_id"
  add_foreign_key "curriculum_profile_assignments", "academic_years"
  add_foreign_key "curriculum_profile_assignments", "courses"
  add_foreign_key "curriculum_profile_assignments", "schools"
  add_foreign_key "curriculum_profile_assignments", "tenants"
  add_foreign_key "curriculum_profile_assignments", "users", column: "assigned_by_id"
  add_foreign_key "curriculum_profile_releases", "tenants"
  add_foreign_key "curriculum_profile_releases", "users", column: "imported_by_id"
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
  add_foreign_key "feature_flags", "tenants"
  add_foreign_key "goals", "tenants"
  add_foreign_key "goals", "users", column: "student_id"
  add_foreign_key "grade_categories", "courses"
  add_foreign_key "grade_categories", "tenants"
  add_foreign_key "guardian_links", "tenants"
  add_foreign_key "guardian_links", "users", column: "guardian_id"
  add_foreign_key "guardian_links", "users", column: "student_id"
  add_foreign_key "ib_activity_events", "schools"
  add_foreign_key "ib_activity_events", "tenants"
  add_foreign_key "ib_activity_events", "users"
  add_foreign_key "ib_collaboration_sessions", "curriculum_documents"
  add_foreign_key "ib_collaboration_sessions", "schools"
  add_foreign_key "ib_collaboration_sessions", "tenants"
  add_foreign_key "ib_collaboration_sessions", "users"
  add_foreign_key "ib_communication_preferences", "schools"
  add_foreign_key "ib_communication_preferences", "tenants"
  add_foreign_key "ib_communication_preferences", "users"
  add_foreign_key "ib_delivery_receipts", "schools"
  add_foreign_key "ib_delivery_receipts", "tenants"
  add_foreign_key "ib_delivery_receipts", "users"
  add_foreign_key "ib_document_collaborators", "curriculum_documents"
  add_foreign_key "ib_document_collaborators", "tenants"
  add_foreign_key "ib_document_collaborators", "users"
  add_foreign_key "ib_document_collaborators", "users", column: "assigned_by_id"
  add_foreign_key "ib_document_comments", "curriculum_documents"
  add_foreign_key "ib_document_comments", "ib_document_comments", column: "parent_comment_id"
  add_foreign_key "ib_document_comments", "tenants"
  add_foreign_key "ib_document_comments", "users", column: "author_id"
  add_foreign_key "ib_document_comments", "users", column: "resolved_by_id"
  add_foreign_key "ib_evidence_items", "curriculum_document_versions"
  add_foreign_key "ib_evidence_items", "curriculum_documents"
  add_foreign_key "ib_evidence_items", "planning_contexts"
  add_foreign_key "ib_evidence_items", "schools"
  add_foreign_key "ib_evidence_items", "tenants"
  add_foreign_key "ib_evidence_items", "users", column: "created_by_id"
  add_foreign_key "ib_evidence_items", "users", column: "student_id"
  add_foreign_key "ib_import_batches", "academic_years"
  add_foreign_key "ib_import_batches", "schools"
  add_foreign_key "ib_import_batches", "tenants"
  add_foreign_key "ib_import_batches", "users", column: "executed_by_id"
  add_foreign_key "ib_import_batches", "users", column: "initiated_by_id"
  add_foreign_key "ib_import_rows", "ib_import_batches"
  add_foreign_key "ib_import_rows", "tenants"
  add_foreign_key "ib_learning_stories", "curriculum_documents"
  add_foreign_key "ib_learning_stories", "planning_contexts"
  add_foreign_key "ib_learning_stories", "schools"
  add_foreign_key "ib_learning_stories", "tenants"
  add_foreign_key "ib_learning_stories", "users", column: "created_by_id"
  add_foreign_key "ib_learning_story_blocks", "ib_learning_stories"
  add_foreign_key "ib_learning_story_blocks", "tenants"
  add_foreign_key "ib_learning_story_evidence_items", "ib_evidence_items"
  add_foreign_key "ib_learning_story_evidence_items", "ib_learning_stories"
  add_foreign_key "ib_learning_story_evidence_items", "tenants"
  add_foreign_key "ib_learning_story_translations", "ib_learning_stories"
  add_foreign_key "ib_learning_story_translations", "tenants"
  add_foreign_key "ib_learning_story_translations", "users", column: "translated_by_id"
  add_foreign_key "ib_operational_checkpoints", "ib_operational_records"
  add_foreign_key "ib_operational_checkpoints", "tenants"
  add_foreign_key "ib_operational_checkpoints", "users", column: "reviewer_id"
  add_foreign_key "ib_operational_records", "curriculum_documents"
  add_foreign_key "ib_operational_records", "planning_contexts"
  add_foreign_key "ib_operational_records", "schools"
  add_foreign_key "ib_operational_records", "tenants"
  add_foreign_key "ib_operational_records", "users", column: "advisor_id"
  add_foreign_key "ib_operational_records", "users", column: "owner_id"
  add_foreign_key "ib_operational_records", "users", column: "student_id"
  add_foreign_key "ib_pilot_setups", "schools"
  add_foreign_key "ib_pilot_setups", "tenants"
  add_foreign_key "ib_pilot_setups", "users", column: "created_by_id"
  add_foreign_key "ib_pilot_setups", "users", column: "updated_by_id"
  add_foreign_key "ib_portfolio_collections", "schools"
  add_foreign_key "ib_portfolio_collections", "tenants"
  add_foreign_key "ib_portfolio_collections", "users", column: "created_by_id"
  add_foreign_key "ib_portfolio_collections", "users", column: "student_id"
  add_foreign_key "ib_programme_settings", "schools"
  add_foreign_key "ib_programme_settings", "tenants"
  add_foreign_key "ib_programme_settings", "users", column: "updated_by_id"
  add_foreign_key "ib_publishing_audits", "ib_learning_stories"
  add_foreign_key "ib_publishing_audits", "ib_publishing_queue_items"
  add_foreign_key "ib_publishing_audits", "schools"
  add_foreign_key "ib_publishing_audits", "tenants"
  add_foreign_key "ib_publishing_audits", "users", column: "changed_by_id"
  add_foreign_key "ib_publishing_queue_items", "ib_learning_stories"
  add_foreign_key "ib_publishing_queue_items", "schools"
  add_foreign_key "ib_publishing_queue_items", "tenants"
  add_foreign_key "ib_publishing_queue_items", "users", column: "created_by_id"
  add_foreign_key "ib_reflection_requests", "ib_evidence_items"
  add_foreign_key "ib_reflection_requests", "tenants"
  add_foreign_key "ib_reflection_requests", "users", column: "requested_by_id"
  add_foreign_key "ib_reflection_requests", "users", column: "student_id"
  add_foreign_key "ib_release_baselines", "schools"
  add_foreign_key "ib_release_baselines", "tenants"
  add_foreign_key "ib_release_baselines", "users", column: "certified_by_id"
  add_foreign_key "ib_release_baselines", "users", column: "created_by_id"
  add_foreign_key "ib_report_deliveries", "ib_report_versions"
  add_foreign_key "ib_report_deliveries", "ib_reports"
  add_foreign_key "ib_report_deliveries", "schools"
  add_foreign_key "ib_report_deliveries", "tenants"
  add_foreign_key "ib_report_deliveries", "users", column: "recipient_id"
  add_foreign_key "ib_report_versions", "ib_reports"
  add_foreign_key "ib_report_versions", "tenants"
  add_foreign_key "ib_report_versions", "users", column: "signed_off_by_id"
  add_foreign_key "ib_reports", "academic_years"
  add_foreign_key "ib_reports", "schools"
  add_foreign_key "ib_reports", "tenants"
  add_foreign_key "ib_reports", "users", column: "author_id"
  add_foreign_key "ib_reports", "users", column: "student_id"
  add_foreign_key "ib_saved_searches", "schools"
  add_foreign_key "ib_saved_searches", "tenants"
  add_foreign_key "ib_saved_searches", "users"
  add_foreign_key "ib_specialist_library_items", "schools"
  add_foreign_key "ib_specialist_library_items", "tenants"
  add_foreign_key "ib_specialist_library_items", "users", column: "created_by_id"
  add_foreign_key "ib_standards_cycles", "academic_years"
  add_foreign_key "ib_standards_cycles", "schools"
  add_foreign_key "ib_standards_cycles", "tenants"
  add_foreign_key "ib_standards_cycles", "users", column: "coordinator_id"
  add_foreign_key "ib_standards_exports", "ib_standards_cycles"
  add_foreign_key "ib_standards_exports", "ib_standards_packets"
  add_foreign_key "ib_standards_exports", "schools"
  add_foreign_key "ib_standards_exports", "tenants"
  add_foreign_key "ib_standards_exports", "users", column: "initiated_by_id"
  add_foreign_key "ib_standards_packet_items", "ib_standards_packets"
  add_foreign_key "ib_standards_packet_items", "tenants"
  add_foreign_key "ib_standards_packets", "ib_standards_cycles"
  add_foreign_key "ib_standards_packets", "schools"
  add_foreign_key "ib_standards_packets", "tenants"
  add_foreign_key "ib_standards_packets", "users", column: "owner_id"
  add_foreign_key "ib_standards_packets", "users", column: "reviewer_id"
  add_foreign_key "ib_user_workspace_preferences", "schools"
  add_foreign_key "ib_user_workspace_preferences", "tenants"
  add_foreign_key "ib_user_workspace_preferences", "users"
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
  add_foreign_key "mobile_sessions", "tenants"
  add_foreign_key "mobile_sessions", "users"
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
  add_foreign_key "planning_context_courses", "courses"
  add_foreign_key "planning_context_courses", "planning_contexts"
  add_foreign_key "planning_context_courses", "tenants"
  add_foreign_key "planning_contexts", "academic_years"
  add_foreign_key "planning_contexts", "schools"
  add_foreign_key "planning_contexts", "tenants"
  add_foreign_key "planning_contexts", "users", column: "created_by_id"
  add_foreign_key "pyp_programme_of_inquiries", "academic_years"
  add_foreign_key "pyp_programme_of_inquiries", "schools"
  add_foreign_key "pyp_programme_of_inquiries", "tenants"
  add_foreign_key "pyp_programme_of_inquiries", "users", column: "coordinator_id"
  add_foreign_key "pyp_programme_of_inquiry_entries", "curriculum_documents"
  add_foreign_key "pyp_programme_of_inquiry_entries", "planning_contexts"
  add_foreign_key "pyp_programme_of_inquiry_entries", "pyp_programme_of_inquiries"
  add_foreign_key "pyp_programme_of_inquiry_entries", "tenants"
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
  add_foreign_key "section_meetings", "sections"
  add_foreign_key "section_meetings", "tenants"
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
  add_foreign_key "tenants", "districts"
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
