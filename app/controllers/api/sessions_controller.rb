class Api::SessionsController < ApplicationController
  before_action :require_user!, only: [:show, :destroy]

  def show
    render json: { user: session_user_json(current_user) }
  end

  def create
    user = User.find_by(email: params[:email].to_s.strip.downcase)

    if user&.authenticate(params[:password])
      reset_session
      session[:user_id] = user.id
      render json: { user: session_user_json(user) }
    else
      render json: { error: "Invalid email or password." }, status: :unauthorized
    end
  end

  def destroy
    reset_session
    render json: { success: true }
  end

  private

  def session_user_json(user)
    {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      gender: user.gender
    }
  end
end
