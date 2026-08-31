class Connection < ApplicationRecord
  belongs_to :requester, class_name: "User"
  belongs_to :recipient, class_name: "User"

  has_one :conversation, dependent: :destroy

  validates :requester_id, presence: true
  validates :recipient_id, presence: true
  validates :connection_type, inclusion: { in: %w[friendship romantic] }
  validates :status, inclusion: { in: %w[pending accepted rejected] }

  validates :recipient_id, uniqueness: {
    scope: :requester_id,
    message: "has already been connected to by this user"
  }

  validate :cannot_connect_to_self

  private

  def cannot_connect_to_self
    errors.add(:recipient_id, "cannot be yourself") if requester_id == recipient_id
  end
end