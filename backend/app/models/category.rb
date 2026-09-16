class Category < ApplicationRecord
  has_many :expenses, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :auto_approve_limit, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(is_active: true) }
  scope :inactive, -> { where(is_active: false) }
end
