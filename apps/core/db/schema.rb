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

ActiveRecord::Schema[8.1].define(version: 2026_02_13_195018) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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

  create_table "tenants", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.jsonb "settings", default: {}
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_tenants_on_slug", unique: true
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

  add_foreign_key "roles", "tenants"
  add_foreign_key "schools", "tenants"
  add_foreign_key "user_roles", "roles"
  add_foreign_key "user_roles", "tenants"
  add_foreign_key "user_roles", "users"
  add_foreign_key "users", "tenants"
end
