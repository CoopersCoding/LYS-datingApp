class Conversation < ApplicationRecord
  belongs_to :connection

  has_many :messages, dependent: :destroy

  validates :connection_id, uniqueness: true
  validate :connection_must_be_accepted

  private

  def connection_must_be_accepted
    return if connection.nil? || connection.status == "accepted"

    errors.add(:connection, "must be accepted before starting a conversation")
  end
end