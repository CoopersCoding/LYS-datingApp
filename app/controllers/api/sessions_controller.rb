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
      render json: {
        user: session_user_json(user),
        csrf_token: form_authenticity_token
      }
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
      full_name: user.full_name,
      email: user.email,
      birthdate: user.birthdate,
      city: user.city,
      state: user.state,
      gender: user.gender,
      bio: user.bio,
      profile_image_url: user.profile_image_url,
      looking_for_friendship: user.looking_for_friendship,
      looking_for_romance: user.looking_for_romance,
      interests: user.interests.order(:name).map do |interest|
        {
          id: interest.id,
          name: interest.name,
          category: interest.category
        }
      end
    }
  end
end
