module ExpenseService
  class Review
    def self.call(expense, reviewer, decision, comment = nil)
      new(expense, reviewer, decision, comment).call
    end

    def initialize(expense, reviewer, decision, comment)
      @expense = expense
      @reviewer = reviewer
      @decision = decision.to_s
      @comment = comment
    end

    def call
      Expense.transaction do
        expense.lock!
        raise StandardError, "Expense is not submitted" unless expense.submitted?
        raise StandardError, "You are not authorized to review this expense" unless reviewer.can_review?(expense)
        raise StandardError, "Rejection comment is required" if decision == "reject" && comment.blank?
        raise StandardError, "Invalid review decision" unless %w[approve reject].include?(decision)

        new_status = decision == "approve" ? "approved" : "rejected"
        expense.update!(status: new_status)
        expense.expense_histories.create!(
          actor: reviewer,
          actor_type: "user",
          actor_name: reviewer.name,
          previous_status: "submitted",
          new_status: new_status,
          comment: comment.presence || "Approved by #{reviewer.name}",
          created_at: Time.current
        )
        expense.notifications.create!(
          user: expense.user,
          message: notification_message(new_status),
          created_at: Time.current
        )
      end

      expense
    end

    private

    attr_reader :expense, :reviewer, :decision, :comment

    def notification_message(new_status)
      if new_status == "approved"
        "Your expense '#{expense.title}' was approved by #{reviewer.name}."
      else
        "Your expense '#{expense.title}' was rejected by #{reviewer.name}: #{comment}"
      end
    end
  end
end