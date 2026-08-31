class User < ApplicationRecord
  has_secure_password

  has_many :user_interests, dependent: :destroy
  has_many :interests, through: :user_interests

  has_many :sent_connections,
           class_name: "Connection",
           foreign_key: :requester_id,
           dependent: :destroy

  has_many :received_connections,
           class_name: "Connection",
           foreign_key: :recipient_id,
           dependent: :destroy

  validates :first_name, presence: true
  validates :last_name, presence: true

  validates :email,
            presence: true,
            uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP }

  validates :password,
            length: { minimum: 8 },
            allow_nil: true

  before_validation :normalize_email

  def full_name
    "#{first_name} #{last_name}"
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end
end