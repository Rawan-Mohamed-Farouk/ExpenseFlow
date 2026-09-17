module ExpenseService
  class Reopen
    def self.call(expense, owner)
      new(expense, owner).call
    end

    def initialize(expense, owner)
      @expense = expense
      @owner = owner
    end

    def call
      Expense.transaction do
        expense.lock!
        raise StandardError, "Only the owner can reopen an expense" unless expense.user_id == owner.id
        raise StandardError, "Only rejected expenses can be reopened" unless expense.rejected?

        expense.update!(status: "draft")
        expense.expense_histories.create!(
          actor: owner,
          actor_type: "user",
          actor_name: owner.name,
          previous_status: "rejected",
          new_status: "draft",
          comment: "Reopened by owner",
          created_at: Time.current
        )
        expense.notifications.create!(
          user: expense.user,
          message: "Your expense '#{expense.title}' was reopened and is now in draft.",
          created_at: Time.current
        )
      end

      expense
    end

    private

    attr_reader :expense, :owner
  end
end