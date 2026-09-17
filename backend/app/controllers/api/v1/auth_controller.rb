module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:login]

      # POST /api/v1/auth/login
      def login
        email = params[:email].to_s.downcase.strip
        user = User.find_by("lower(email) = ?", email)

        if user && user.authenticate(params[:password])
          unless user.is_active?
            return render json: { error: "Your account has been deactivated. Please contact an administrator." }, status: :unauthorized
          end

          token = JsonWebToken.encode({ user_id: user.id, role: user.role })
          render json: {
            token: token,
            user: serialize_user(user)
          }, status: :ok
        else
          render json: { error: "Invalid email or password." }, status: :unauthorized
        end
      end

      # DELETE /api/v1/auth/logout
      def logout
        token = request.headers["Authorization"].to_s.split(" ").last
        JsonWebToken.revoke(token) if token.present?
        render json: { message: "Successfully logged out." }, status: :ok
      end

      # GET /api/v1/me
      def me
        render json: { user: serialize_user(current_user) }, status: :ok
      end
    end
  end
end
