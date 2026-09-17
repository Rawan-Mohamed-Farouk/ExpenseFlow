class AddBusinessCheckConstraints < ActiveRecord::Migration[8.1]
  def change
    add_check_constraint :users, "role IN ('employee', 'manager', 'admin')", name: "users_role_valid"
    add_check_constraint :categories, "auto_approve_limit >= 0", name: "categories_auto_approve_limit_nonnegative"
    add_check_constraint :expenses, "status IN ('draft', 'submitted', 'approved', 'rejected', 'reimbursed')", name: "expenses_status_valid"
    add_check_constraint :expenses, "amount > 0 AND amount <= 100000", name: "expenses_amount_valid"
  end
end
