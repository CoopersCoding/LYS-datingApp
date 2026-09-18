class Api::ConversationsController < ApplicationController
  before_action :require_user!

  def index
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

    data = {
      id: conversation.id,
      connection_id: connection.id,
      connection_type: connection.connection_type,
      other_user: {
        id: other_user.id,
        first_name: other_user.first_name,
        last_name: other_user.last_name,
        profile_image_url: other_user.profile_image_url
      },
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
