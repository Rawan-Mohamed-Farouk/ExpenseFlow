class User < ApplicationRecord
  has_secure_password

  ROLES = %w[employee manager admin].freeze

  belongs_to :team, optional: true
  has_one :managed_team, class_name: "Team", foreign_key: "manager_id", dependent: :nullify
  has_many :expenses, dependent: :restrict_with_error
  has_many :notifications, dependent: :destroy
  has_many :expense_histories, foreign_key: "actor_id", dependent: :nullify

  validates :name, presence: true
  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: ROLES }

  before_save :downcase_email

  def employee?
    role == "employee"
  end

  def manager?
    role == "manager"
  end

  def admin?
    role == "admin"
  end

  def active?
    is_active
  end

  # Check if this user can review a specific expense
  def can_review?(expense)
    return false unless is_active?
    return false if expense.user_id == id # Nobody can review their own expense
    return false unless expense.status == "submitted"

    if manager?
      # Manager can review submitted expenses of their managed team members
      managed_team.present? && expense.user.team_id == managed_team.id && expense.user.role == "employee"
    elsif admin?
      # Admin reviews manager and admin expenses, but never their own.
      expense.user.role.in?(%w[manager admin])
    else
      false
    end
  end

  # Returns scope of submitted expenses waiting for this user's review
  def reviewable_expenses
    return Expense.none unless is_active?

    if manager?
      return Expense.none unless managed_team.present?

      Expense.submitted
             .joins(:user)
             .where(users: { team_id: managed_team.id, role: "employee" })
             .where.not(user_id: id)
    elsif admin?
      Expense.submitted
             .joins(:user)
             .where(users: { role: %w[manager admin] })
             .where.not(user_id: id)
    else
      Expense.none
    end
  end

  # Returns expenses visible to this user
  def visible_expenses
    return Expense.none unless is_active?

    if admin?
      Expense.all
    elsif manager?
      if managed_team.present?
        Expense.joins(:user).where("expenses.user_id = ? OR (users.team_id = ? AND users.role = 'employee')", id, managed_team.id)
      else
        expenses
      end
    else
      expenses
    end
  end

  private

  def downcase_email
    self.email = email.downcase.strip if email.present?
  end
end
