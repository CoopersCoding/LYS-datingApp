class Api::UsersController < ApplicationController
  before_action :require_user!, only: [:me, :update]

  def index
    users = User.includes(:interests).order(:first_name, :last_name)
    users = users.where.not(id: current_user.id) if current_user

    render json: { users: users.map { |user| profile_json(user) } }
  end

  def show
    user = User.includes(:interests).find(params[:id])
    render json: { user: profile_json(user) }
  end

  def create
    user = User.new(user_params)

    if user.save
      session[:user_id] = user.id
      render json: { user: private_profile_json(user) }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def me
    render json: { user: private_profile_json(current_user) }
  end

  def update
    if current_user.update(profile_params)
      render json: { user: private_profile_json(current_user.reload) }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(
      :first_name,
      :last_name,
      :email,
      :password,
      :password_confirmation,
      :birthdate,
      :city,
      :state,
      :gender,
      :bio,
      :profile_image_url,
      :looking_for_friendship,
      :looking_for_romance,
      interest_ids: []
    )
  end

  def profile_params
    params.require(:user).permit(
      :first_name,
      :last_name,
      :birthdate,
      :city,
      :state,
      :gender,
      :bio,
      :profile_image_url,
      :looking_for_friendship,
      :looking_for_romance,
      interest_ids: []
    )
  end

  def profile_json(user)
    {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      birthdate: user.birthdate,
      city: user.city,
      state: user.state,
      gender: user.gender,
      bio: user.bio,
      profile_image_url: user.profile_image_url,
      looking_for_friendship: user.looking_for_friendship,
      looking_for_romance: user.looking_for_romance,
      interests: user.interests.map { |interest| { id: interest.id, name: interest.name, category: interest.category } }
    }
  end

  def private_profile_json(user)
    profile_json(user).merge(email: user.email)
  end
end
