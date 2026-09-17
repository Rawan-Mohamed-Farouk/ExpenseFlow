class Expense < ApplicationRecord
  STATUSES = %w[draft submitted approved rejected reimbursed].freeze

  belongs_to :user
  belongs_to :category
  has_many :expense_histories, -> { order(created_at: :asc) }, dependent: :destroy
  has_many :notifications, dependent: :destroy

  validates :title, presence: true
  validates :amount, presence: true,
                     numericality: { greater_than: 0, less_than_or_equal_to: 100_000 }
  validates :spent_date, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validate :spent_date_not_in_future
  validate :spent_date_within_ninety_days
  validate :category_must_be_active, on: :create
  validate :payment_reference_required_if_reimbursed

  # Scopes
  scope :draft, -> { where(status: "draft") }
  scope :submitted, -> { where(status: "submitted") }
  scope :approved, -> { where(status: "approved") }
  scope :rejected, -> { where(status: "rejected") }
  scope :reimbursed, -> { where(status: "reimbursed") }
  scope :recent, -> { order(created_at: :desc) }

  def draft?
    status == "draft"
  end

  def submitted?
    status == "submitted"
  end

  def approved?
    status == "approved"
  end

  def rejected?
    status == "rejected"
  end

  def reimbursed?
    status == "reimbursed"
  end

  def can_edit_or_delete?(acting_user)
    acting_user.id == user_id && draft?
  end

  # State transition methods
  def submit!(acting_user)
    ExpenseService::Submit.call(self, acting_user)
  end

  def approve!(reviewer, comment = nil)
    ExpenseService::Review.call(self, reviewer, :approve, comment)
  end

  def reject!(reviewer, comment)
    ExpenseService::Review.call(self, reviewer, :reject, comment)
  end

  def reopen!(acting_user)
    ExpenseService::Reopen.call(self, acting_user)
  end

  def reimburse!(admin_user, payment_ref)
    ExpenseService::Reimburse.call(self, admin_user, payment_ref)
  end

  private

  def spent_date_not_in_future
    return if spent_date.blank?

    if spent_date > Time.current.to_date
      errors.add(:spent_date, "cannot be in the future")
    end
  end

  def spent_date_within_ninety_days
    return if spent_date.blank? || submitted_at.blank?

    if spent_date < submitted_at.to_date - 90.days
      errors.add(:spent_date, "cannot be more than 90 days before submission date")
    end
  end

  def category_must_be_active
    return if category.blank?

    unless category.is_active?
      errors.add(:category, "must be active")
    end
  end

  def payment_reference_required_if_reimbursed
    if status == "reimbursed" && payment_reference.blank?
      errors.add(:payment_reference, "is required for reimbursed expenses")
    end
  end
end
