class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :user

  validates :body, presence: true
  validate :user_must_be_part_of_conversation

  private

  def user_must_be_part_of_conversation
    return if conversation.nil? || user.nil?

    connection = conversation.connection

    unless [connection.requester_id, connection.recipient_id].include?(user_id)
      errors.add(:user, "must be part of this conversation")
    end
  end
end