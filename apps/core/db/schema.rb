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

ActiveRecord::Schema[8.1].define(version: 2026_02_13_210003) do
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

  create_table "courses", force: :cascade do |t|
    t.bigint "academic_year_id", null: false
    t.string "code"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["academic_year_id"], name: "index_courses_on_academic_year_id"
    t.index ["tenant_id"], name: "index_courses_on_tenant_id"
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
    t.index ["user_id", "section_id"], name: "index_enrollments_on_user_id_and_section_id", unique: true
    t.index ["user_id"], name: "index_enrollments_on_user_id"
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
    t.index ["tenant_id"], name: "index_lesson_plans_on_tenant_id"
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

  create_table "resource_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "drive_file_id"
    t.bigint "linkable_id", null: false
    t.string "linkable_type", null: false
    t.string "mime_type"
    t.string "provider", default: "url", null: false
    t.bigint "tenant_id", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "url", null: false
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
    t.index ["standard_framework_id"], name: "index_standards_on_standard_framework_id"
    t.index ["tenant_id"], name: "index_standards_on_tenant_id"
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
    t.string "status", default: "draft", null: false
    t.bigint "tenant_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_unit_plans_on_course_id"
    t.index ["created_by_id"], name: "index_unit_plans_on_created_by_id"
    t.index ["current_version_id"], name: "index_unit_plans_on_current_version_id"
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
    t.string "last_name"
    t.bigint "tenant_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "email"], name: "index_users_on_tenant_id_and_email", unique: true
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
  end

  add_foreign_key "academic_years", "tenants"
  add_foreign_key "courses", "academic_years"
  add_foreign_key "courses", "tenants"
  add_foreign_key "enrollments", "sections"
  add_foreign_key "enrollments", "tenants"
  add_foreign_key "enrollments", "users"
  add_foreign_key "lesson_plans", "lesson_versions", column: "current_version_id"
  add_foreign_key "lesson_plans", "tenants"
  add_foreign_key "lesson_plans", "unit_plans"
  add_foreign_key "lesson_plans", "users", column: "created_by_id"
  add_foreign_key "lesson_versions", "lesson_plans"
  add_foreign_key "lesson_versions", "tenants"
  add_foreign_key "resource_links", "tenants"
  add_foreign_key "roles", "tenants"
  add_foreign_key "schools", "tenants"
  add_foreign_key "sections", "courses"
  add_foreign_key "sections", "tenants"
  add_foreign_key "sections", "terms"
  add_foreign_key "standard_frameworks", "tenants"
  add_foreign_key "standards", "standard_frameworks"
  add_foreign_key "standards", "standards", column: "parent_id"
  add_foreign_key "standards", "tenants"
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
