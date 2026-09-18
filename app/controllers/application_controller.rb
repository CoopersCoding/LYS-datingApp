class ApplicationController < ActionController::Base
  helper_method :current_user

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
  end

  def require_user!
    return if current_user

    render json: { error: "You must be signed in." }, status: :unauthorized
  end
end
