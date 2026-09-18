Rails.application.routes.draw do
  root to: "static_pages#index"

  namespace :api do
    post "signup", to: "users#create"
    get "me", to: "users#me"

    resource :session, only: [:show, :create, :destroy]

    resources :users, only: [:index, :show, :update]
    resources :interests, only: [:index]

    resources :connections, only: [:index, :create, :update, :destroy] do
      collection do
        get :pending
        get :accepted
      end
    end

    resources :conversations, only: [:index, :show] do
      resources :messages, only: [:index, :create]
    end
  end
end
