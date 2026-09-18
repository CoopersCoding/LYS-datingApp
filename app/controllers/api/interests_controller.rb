class Api::InterestsController < ApplicationController
  def index
    interests = Interest.order(:category, :name)
    render json: { interests: interests.as_json(only: [:id, :name, :category]) }
  end
end
