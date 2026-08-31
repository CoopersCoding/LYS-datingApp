class Api::UsersController < ApplicationController
  def index
    users = User.all

    render json: users.as_json(
      only: [
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
    )
  end
end