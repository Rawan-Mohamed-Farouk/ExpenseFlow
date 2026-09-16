class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :expense

  validates :message, presence: true

  scope :unread, -> { where(is_read: false) }
  scope :recent, -> { order(created_at: :desc) }
end
