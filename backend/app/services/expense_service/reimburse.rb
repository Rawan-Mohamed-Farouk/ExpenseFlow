module ExpenseService
  class Reimburse
    def self.call(expense, admin, payment_reference)
      new(expense, admin, payment_reference).call
    end

    def initialize(expense, admin, payment_reference)
      @expense = expense
      @admin = admin
      @payment_reference = payment_reference
    end

    def call
      Expense.transaction do
        expense.lock!
        raise StandardError, "Only admins can reimburse expenses" unless admin.admin?
        raise StandardError, "Only approved expenses can be reimbursed" unless expense.approved?
        raise StandardError, "Payment reference is required" if payment_reference.blank?

        expense.update!(status: "reimbursed", reimbursed_at: Time.current, payment_reference: payment_reference)
        expense.expense_histories.create!(
          actor: admin,
          actor_type: "user",
          actor_name: admin.name,
          previous_status: "approved",
          new_status: "reimbursed",
          comment: "Payment Reference: #{payment_reference}",
          created_at: Time.current
        )
        expense.notifications.create!(
          user: expense.user,
          message: "Your expense '#{expense.title}' has been reimbursed. Ref: #{payment_reference}",
          created_at: Time.current
        )
      end

      expense
    end

    private

    attr_reader :expense, :admin, :payment_reference
  end
end