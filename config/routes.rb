Rails.application.routes.draw do
  root to: "static_pages#index"

  namespace :api do
    resources :users, only: [:index]
  end
end