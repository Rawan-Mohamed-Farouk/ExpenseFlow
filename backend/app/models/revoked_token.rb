class RevokedToken < ApplicationRecord
  validates :jti, presence: true, uniqueness: true
end
