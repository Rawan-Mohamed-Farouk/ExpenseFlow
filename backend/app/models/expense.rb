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
    raise StandardError, "Only the owner can submit an expense" unless acting_user.id == user_id
    raise StandardError, "Only draft expenses can be submitted" unless draft?

    reference_date = Time.current.to_date
    if spent_date < reference_date - 90.days
      errors.add(:spent_date, "cannot be more than 90 days before submission date")
      raise ActiveRecord::RecordInvalid.new(self)
    end

    transaction do
      if category.auto_approve_limit.present? && amount <= category.auto_approve_limit
        # Auto-approve by system
        update!(
          status: "approved",
          submitted_at: Time.current
        )
        expense_histories.create!(
          actor_type: "system",
          actor_name: "System",
          previous_status: "draft",
          new_status: "approved",
          comment: "Auto-approved: Amount ($#{amount}) is within category limit ($#{category.auto_approve_limit})",
          created_at: Time.current
        )
        notifications.create!(
          user: user,
          message: "Your expense '#{title}' ($#{amount}) was automatically approved.",
          created_at: Time.current
        )
      else
        update!(
          status: "submitted",
          submitted_at: Time.current
        )
        expense_histories.create!(
          actor: acting_user,
          actor_type: "user",
          actor_name: acting_user.name,
          previous_status: "draft",
          new_status: "submitted",
          comment: "Submitted for review",
          created_at: Time.current
        )
        notifications.create!(
          user: user,
          message: "Your expense '#{title}' ($#{amount}) was submitted for review.",
          created_at: Time.current
        )
      end
    end
    self
  end

  def approve!(reviewer, comment = nil)
    raise StandardError, "Expense is not submitted" unless submitted?
    raise StandardError, "You are not authorized to approve this expense" unless reviewer.can_review?(self)

    transaction do
      update!(status: "approved")
      expense_histories.create!(
        actor: reviewer,
        actor_type: "user",
        actor_name: reviewer.name,
        previous_status: "submitted",
        new_status: "approved",
        comment: comment.presence || "Approved by #{reviewer.name}",
        created_at: Time.current
      )
      notifications.create!(
        user: user,
        message: "Your expense '#{title}' was approved by #{reviewer.name}.",
        created_at: Time.current
      )
    end
    self
  end

  def reject!(reviewer, comment)
    raise StandardError, "Expense is not submitted" unless submitted?
    raise StandardError, "Rejection comment is required" if comment.blank?
    raise StandardError, "You are not authorized to reject this expense" unless reviewer.can_review?(self)

    transaction do
      update!(status: "rejected")
      expense_histories.create!(
        actor: reviewer,
        actor_type: "user",
        actor_name: reviewer.name,
        previous_status: "submitted",
        new_status: "rejected",
        comment: comment,
        created_at: Time.current
      )
      notifications.create!(
        user: user,
        message: "Your expense '#{title}' was rejected by #{reviewer.name}: #{comment}",
        created_at: Time.current
      )
    end
    self
  end

  def reopen!(acting_user)
    raise StandardError, "Only the owner can reopen an expense" unless acting_user.id == user_id
    raise StandardError, "Only rejected expenses can be reopened" unless rejected?

    transaction do
      update!(status: "draft")
      expense_histories.create!(
        actor: acting_user,
        actor_type: "user",
        actor_name: acting_user.name,
        previous_status: "rejected",
        new_status: "draft",
        comment: "Reopened by owner",
        created_at: Time.current
      )
      notifications.create!(
        user: user,
        message: "Your expense '#{title}' was reopened and is now in draft.",
        created_at: Time.current
      )
    end
    self
  end

  def reimburse!(admin_user, payment_ref)
    raise StandardError, "Only admins can reimburse expenses" unless admin_user.admin?
    raise StandardError, "Only approved expenses can be reimbursed" unless approved?
    raise StandardError, "Payment reference is required" if payment_ref.blank?

    transaction do
      update!(
        status: "reimbursed",
        reimbursed_at: Time.current,
        payment_reference: payment_ref
      )
      expense_histories.create!(
        actor: admin_user,
        actor_type: "user",
        actor_name: admin_user.name,
        previous_status: "approved",
        new_status: "reimbursed",
        comment: "Payment Reference: #{payment_ref}",
        created_at: Time.current
      )
      notifications.create!(
        user: user,
        message: "Your expense '#{title}' has been reimbursed. Ref: #{payment_ref}",
        created_at: Time.current
      )
    end
    self
  end

  private

  def spent_date_not_in_future
    return if spent_date.blank?

    if spent_date > Time.current.to_date
      errors.add(:spent_date, "cannot be in the future")
    end
  end

  def spent_date_within_ninety_days
    return if spent_date.blank?

    ref_date = submitted_at.present? ? submitted_at.to_date : Time.current.to_date
    if spent_date < ref_date - 90.days
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
