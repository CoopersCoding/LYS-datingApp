class Api::UsersController < ApplicationController
  def index
    users = User.all

    render json: users.as_json(
      only: profile_fields
    )
  end

  def show
    user = User.find(params[:id])

    render json: user.as_json(
      only: profile_fields
    )
  end

  private

  def profile_fields
    [
      :id,
      :first_name,
      :last_name,
      :city,
      :state,
      :gender,
      :bio,
      :profile_image_url,
      :looking_for_friendship,
      :looking_for_romance
    ]
  end
end