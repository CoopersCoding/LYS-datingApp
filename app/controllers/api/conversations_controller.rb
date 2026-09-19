class Api::ConversationsController < ApplicationController
  before_action :require_user!

  def index
    ensure_demo_conversations!
    conversations = accessible_conversations.includes(:messages)

    render json: {
      conversations: conversations.map { |conversation| conversation_json(conversation) }
    }
  end

  def show
    conversation = accessible_conversations.find(params[:id])
    render json: { conversation: conversation_json(conversation, include_messages: true) }
  end

  private

  def ensure_demo_conversations!
    demo_emails = %w[
      mia@lastyearsingle.test
      noah@lastyearsingle.test
      sofia@lastyearsingle.test
    ]

    User.where(email: demo_emails).find_each do |demo_user|
      next if demo_user.id == current_user.id

      connection = Connection.find_by(requester: current_user, recipient: demo_user) ||
                   Connection.find_by(requester: demo_user, recipient: current_user)

      unless connection
        connection = Connection.create!(
          requester: current_user,
          recipient: demo_user,
          connection_type: demo_user.email.start_with?("sofia@") ? "romantic" : "friendship",
          status: "accepted"
        )
      end

      connection.update!(status: "accepted") unless connection.status == "accepted"
      conversation = Conversation.find_or_create_by!(connection: connection)

      next unless conversation.messages.empty?

      starter = case demo_user.first_name
                when "Mia" then "Have you tried that little coffee place downtown yet?"
                when "Noah" then "You mentioned you like being near the water."
                else "I think travel tells you a lot about a person."
                end

      conversation.messages.create!(user: demo_user, body: starter)
    end
  end

  def profile_image_for(user)
    return user.profile_image_url if user.profile_image_url.present?

    {
      "mia@lastyearsingle.test" => "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85",
      "noah@lastyearsingle.test" => "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85",
      "sofia@lastyearsingle.test" => "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=700&q=85"
    }[user.email]
  end

  def accessible_conversations
    Conversation
      .joins(:connection)
      .includes(connection: [:requester, :recipient])
      .where(connections: { status: "accepted" })
      .where(
        "connections.requester_id = :id OR connections.recipient_id = :id",
        id: current_user.id
      )
      .order(updated_at: :desc)
  end

  def conversation_json(conversation, include_messages: false)
    connection = conversation.connection
    other_user = connection.requester_id == current_user.id ? connection.recipient : connection.requester
    latest_message = conversation.messages.order(created_at: :desc).first

    data = {
      id: conversation.id,
      connection_id: connection.id,
      connection_type: connection.connection_type,
      other_user: {
        id: other_user.id,
        first_name: other_user.first_name,
        last_name: other_user.last_name,
        city: other_user.city,
        state: other_user.state,
        profile_image_url: profile_image_for(other_user)
      },
      last_message: latest_message&.body,
      updated_at: conversation.updated_at
    }

    if include_messages
      data[:messages] = conversation.messages.includes(:user).order(:created_at).map do |message|
        {
          id: message.id,
          body: message.body,
          user_id: message.user_id,
          sender_name: message.user.first_name,
          mine: message.user_id == current_user.id,
          created_at: message.created_at
        }
      end
    end

    data
  end
end
