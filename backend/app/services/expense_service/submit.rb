module ExpenseService
  class Submit
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
        raise StandardError, "Only the owner can submit an expense" unless expense.user_id == owner.id
        raise StandardError, "Only draft expenses can be submitted" unless expense.draft?
        unless expense.category.is_active?
          expense.errors.add(:category, "must be active when submitting")
          raise ActiveRecord::RecordInvalid.new(expense)
        end

        expense.errors.add(:spent_date, "cannot be more than 90 days before submission date") if expense.spent_date < Date.current - 90.days
        raise ActiveRecord::RecordInvalid.new(expense) if expense.errors.any?

        submitted_at = Time.current
        if expense.amount <= expense.category.auto_approve_limit
          transition!("submitted", submitted_at, "user", owner.name, owner.id, "Submitted for review")
          transition!("approved", submitted_at, "system", "System", nil,
                      "Auto-approved: Amount ($#{expense.amount}) is within category limit ($#{expense.category.auto_approve_limit})")
          notify!("Your expense '#{expense.title}' ($#{expense.amount}) was automatically approved.")
        else
          transition!("submitted", submitted_at, "user", owner.name, owner.id, "Submitted for review")
          notify!("Your expense '#{expense.title}' ($#{expense.amount}) was submitted for review.")
        end
      end

      expense
    end

    private

    attr_reader :expense, :owner

    def transition!(new_status, submitted_at, actor_type, actor_name, actor_id, comment)
      expense.update!(status: new_status, submitted_at: submitted_at)
      expense.expense_histories.create!(
        actor_type: actor_type,
        actor_name: actor_name,
        actor_id: actor_id,
        previous_status: "draft",
        new_status: new_status,
        comment: comment,
        created_at: Time.current
      )
    end

    def notify!(message)
      expense.notifications.create!(user: expense.user, message: message, created_at: Time.current)
    end
  end
end