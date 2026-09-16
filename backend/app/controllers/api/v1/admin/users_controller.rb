module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        before_action :require_admin!
        before_action :set_user, only: [:show, :update, :deactivate]

        # GET /api/v1/admin/users
        def index
          users = User.includes(:team, :managed_team).order(:name)
          render json: {
            users: users.map { |u| serialize_user(u) }
          }, status: :ok
        end

        # GET /api/v1/admin/users/:id
        def show
          render json: { user: serialize_user(@user) }, status: :ok
        end

        # POST /api/v1/admin/users
        def create
          user = User.new(user_params)
          if user.save
            render json: { user: serialize_user(user), message: "User created successfully." }, status: :created
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/admin/users/:id
        def update
          if user_params[:password].blank?
            params_to_update = user_params.except(:password)
          else
            params_to_update = user_params
          end

          if @user.update(params_to_update)
            render json: { user: serialize_user(@user), message: "User updated successfully." }, status: :ok
          else
            render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/admin/users/:id/deactivate
        def deactivate
          if @user.id == current_user.id
            return render json: { error: "You cannot deactivate your own account." }, status: :unprocessable_entity
          end

          is_active = params[:is_active].nil? ? false : params[:is_active]
          @user.update(is_active: is_active)
          status_msg = @user.is_active? ? "activated" : "deactivated"
          render json: { user: serialize_user(@user), message: "User #{status_msg} successfully." }, status: :ok
        end

        private

        def set_user
          @user = User.find_by(id: params[:id])
          unless @user
            render json: { error: "User not found." }, status: :not_found
          end
        end

        def user_params
          params.require(:user).permit(:name, :email, :password, :role, :team_id, :is_active)
        end
      end
    end
  end
end
