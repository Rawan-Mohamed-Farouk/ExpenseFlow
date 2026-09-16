class ExpenseHistory < ApplicationRecord
  belongs_to :expense
  belongs_to :actor, class_name: "User", optional: true

  validates :actor_name, presence: true
  validates :new_status, presence: true
  validates :actor_type, presence: true, inclusion: { in: %w[user system] }

  # Prevent modification of history records once created
  before_update :readonly_record
  before_destroy :readonly_record, unless: -> { expense&.destroyed? }

  private

  def readonly_record
    errors.add(:base, "Expense history records are immutable")
    throw(:abort)
  end
end
