class CreateExpenseFlowTables < ActiveRecord::Migration[8.1]
  def change
    # Users table
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "employee"
      t.bigint :team_id
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end
    add_index :users, "lower(email)", unique: true, name: "index_users_on_lower_email"
    add_index :users, :role
    add_index :users, :team_id

    # Teams table
    create_table :teams do |t|
      t.string :name, null: false
      t.bigint :manager_id, null: false

      t.timestamps
    end
    add_index :teams, "lower(name)", unique: true, name: "index_teams_on_lower_name"
    add_index :teams, :manager_id
    add_foreign_key :teams, :users, column: :manager_id
    add_foreign_key :users, :teams, column: :team_id

    # Categories table
    create_table :categories do |t|
      t.string :name, null: false
      t.decimal :auto_approve_limit, precision: 10, scale: 2, null: false, default: 0.0
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end
    add_index :categories, "lower(name)", unique: true, name: "index_categories_on_lower_name"
    add_index :categories, :is_active

    # Expenses table
    create_table :expenses do |t|
      t.references :user, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :spent_date, null: false
      t.string :status, null: false, default: "draft"
      t.string :payment_reference
      t.datetime :submitted_at
      t.datetime :reimbursed_at

      t.timestamps
    end
    add_index :expenses, :status
    add_index :expenses, :spent_date
    add_index :expenses, [:status, :created_at]

    # Expense Histories table
    create_table :expense_histories do |t|
      t.references :expense, null: false, foreign_key: { on_delete: :cascade }
      t.references :actor, foreign_key: { to_table: :users }
      t.string :actor_type, null: false, default: "user" # 'user' or 'system'
      t.string :actor_name, null: false
      t.string :previous_status
      t.string :new_status, null: false
      t.text :comment

      t.datetime :created_at, null: false
    end
    add_index :expense_histories, [:expense_id, :created_at]

    # Notifications table
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :expense, null: false, foreign_key: { on_delete: :cascade }
      t.string :message, null: false
      t.boolean :is_read, null: false, default: false

      t.datetime :created_at, null: false
    end
    add_index :notifications, [:user_id, :is_read]
    add_index :notifications, [:user_id, :created_at]
  end
end
