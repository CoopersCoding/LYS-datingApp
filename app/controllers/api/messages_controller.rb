class Api::MessagesController < ApplicationController
  before_action :require_user!
  before_action :set_conversation

  def index
    messages = @conversation.messages.includes(:user).order(:created_at)

    render json: {
      messages: messages.map { |message| message_json(message) }
    }
  end

  def create
    message = @conversation.messages.new(
      user: current_user,
      body: params.require(:message).permit(:body)[:body]
    )

    if message.save
      @conversation.touch
      render json: { message: message_json(message) }, status: :created
    else
      render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_conversation
    @conversation = Conversation
      .joins(:connection)
      .where(connections: { status: "accepted" })
      .where(
        "connections.requester_id = :id OR connections.recipient_id = :id",
        id: current_user.id
      )
      .find(params[:conversation_id])
  end

  def message_json(message)
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
