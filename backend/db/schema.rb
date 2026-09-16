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

ActiveRecord::Schema[8.1].define(version: 2026_09_16_130500) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "categories", force: :cascade do |t|
    t.decimal "auto_approve_limit", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.boolean "is_active", default: true, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index "lower((name)::text)", name: "index_categories_on_lower_name", unique: true
    t.index ["is_active"], name: "index_categories_on_is_active"
  end

  create_table "expense_histories", force: :cascade do |t|
    t.bigint "actor_id"
    t.string "actor_name", null: false
    t.string "actor_type", default: "user", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.bigint "expense_id", null: false
    t.string "new_status", null: false
    t.string "previous_status"
    t.index ["actor_id"], name: "index_expense_histories_on_actor_id"
    t.index ["expense_id", "created_at"], name: "index_expense_histories_on_expense_id_and_created_at"
    t.index ["expense_id"], name: "index_expense_histories_on_expense_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.bigint "category_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "payment_reference"
    t.datetime "reimbursed_at"
    t.date "spent_date", null: false
    t.string "status", default: "draft", null: false
    t.datetime "submitted_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["category_id"], name: "index_expenses_on_category_id"
    t.index ["spent_date"], name: "index_expenses_on_spent_date"
    t.index ["status", "created_at"], name: "index_expenses_on_status_and_created_at"
    t.index ["status"], name: "index_expenses_on_status"
    t.index ["user_id"], name: "index_expenses_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "expense_id", null: false
    t.boolean "is_read", default: false, null: false
    t.string "message", null: false
    t.bigint "user_id", null: false
    t.index ["expense_id"], name: "index_notifications_on_expense_id"
    t.index ["user_id", "created_at"], name: "index_notifications_on_user_id_and_created_at"
    t.index ["user_id", "is_read"], name: "index_notifications_on_user_id_and_is_read"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "teams", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "manager_id", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index "lower((name)::text)", name: "index_teams_on_lower_name", unique: true
    t.index ["manager_id"], name: "index_teams_on_manager_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.boolean "is_active", default: true, null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", default: "employee", null: false
    t.bigint "team_id"
    t.datetime "updated_at", null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["team_id"], name: "index_users_on_team_id"
  end

  add_foreign_key "expense_histories", "expenses", on_delete: :cascade
  add_foreign_key "expense_histories", "users", column: "actor_id"
  add_foreign_key "expenses", "categories"
  add_foreign_key "expenses", "users"
  add_foreign_key "notifications", "expenses", on_delete: :cascade
  add_foreign_key "notifications", "users", on_delete: :cascade
  add_foreign_key "teams", "users", column: "manager_id"
  add_foreign_key "users", "teams"
end
