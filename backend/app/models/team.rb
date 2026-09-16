class Team < ApplicationRecord
  belongs_to :manager, class_name: "User"
  has_many :members, class_name: "User", foreign_key: "team_id", dependent: :nullify

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validate :manager_must_have_manager_role

  private

  def manager_must_have_manager_role
    return if manager.blank?

    unless manager.manager?
      errors.add(:manager, "must have the manager role")
    end
  end
end
