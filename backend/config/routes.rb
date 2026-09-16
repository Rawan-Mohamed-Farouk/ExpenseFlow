Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Authentication endpoints (fixed by requirements)
      post   "auth/login",  to: "auth#login"
      delete "auth/logout", to: "auth#logout"
      get    "me",          to: "auth#me"

      # Categories (public/authenticated read)
      resources :categories, only: [:index]

      # Expenses
      resources :expenses do
        member do
          post :submit
          post :reopen
          post :approve,   to: "reviews#approve"
          post :reject,    to: "reviews#reject"
          post :reimburse, to: "reimbursements#reimburse"
        end
      end

      # Review Queue
      get "review_queue", to: "reviews#queue"

      # Reimbursements Queue
      get "reimbursements", to: "reimbursements#index"

      # Admin Reports
      get "reports", to: "reports#index"

      # In-app Notifications
      resources :notifications, only: [:index] do
        member do
          patch :read, to: "notifications#mark_as_read"
        end
        collection do
          post :mark_all_read
        end
      end

      # Administration (Admin only)
      namespace :admin do
        resources :users, only: [:index, :show, :create, :update] do
          member do
            patch :deactivate
          end
        end
        resources :teams, only: [:index, :show, :create, :update]
        resources :categories, only: [:index, :show, :create, :update]
      end
    end
  end
end
