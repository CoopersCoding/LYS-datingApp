class Api::ConnectionsController < ApplicationController
  before_action :require_user!
  before_action :set_connection, only: [:update, :destroy]

  def index
    render json: { connections: scoped_connections.map { |connection| connection_json(connection) } }
  end

  def pending
    connections = scoped_connections.where(status: "pending")
    render json: { connections: connections.map { |connection| connection_json(connection) } }
  end

  def accepted
    connections = scoped_connections.where(status: "accepted")
    render json: { connections: connections.map { |connection| connection_json(connection) } }
  end

  def create
    connection = current_user.sent_connections.new(
      recipient_id: connection_params[:recipient_id],
      connection_type: connection_params[:connection_type],
      status: "accepted"
    )

    connection.transaction do
      connection.save!
      Conversation.create!(connection: connection)
    end

    render json: { connection: connection_json(connection.reload) }, status: :created
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def update
    unless @connection.recipient_id == current_user.id
      return render json: { error: "Only the recipient can respond to this request." }, status: :forbidden
    end

    status = params.require(:connection).permit(:status)[:status]
    unless %w[accepted rejected].include?(status)
      return render json: { error: "Status must be accepted or rejected." }, status: :unprocessable_entity
    end

    @connection.transaction do
      @connection.update!(status: status)
      Conversation.find_or_create_by!(connection: @connection) if status == "accepted"
    end

    render json: { connection: connection_json(@connection.reload) }
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def destroy
    unless [@connection.requester_id, @connection.recipient_id].include?(current_user.id)
      return render json: { error: "You are not part of this connection." }, status: :forbidden
    end

    @connection.destroy!
    render json: { success: true }
  end

  private

  def scoped_connections
    Connection
      .includes(:requester, :recipient, :conversation)
      .where("requester_id = :id OR recipient_id = :id", id: current_user.id)
      .order(created_at: :desc)
  end

  def set_connection
    @connection = scoped_connections.find(params[:id])
  end

  def connection_params
    params.require(:connection).permit(:recipient_id, :connection_type)
  end

  def connection_json(connection)
    other_user = connection.requester_id == current_user.id ? connection.recipient : connection.requester

    {
      id: connection.id,
      connection_type: connection.connection_type,
      status: connection.status,
      requester_id: connection.requester_id,
      recipient_id: connection.recipient_id,
      conversation_id: connection.conversation&.id,
      other_user: {
        id: other_user.id,
        first_name: other_user.first_name,
        last_name: other_user.last_name,
        city: other_user.city,
        state: other_user.state,
        profile_image_url: other_user.profile_image_url
      },
      created_at: connection.created_at
    }
  end
end
