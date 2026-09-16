module Api
  module V1
    class CategoriesController < ApplicationController
      # GET /api/v1/categories
      def index
        categories = current_user.admin? ? Category.all : Category.active
        categories = categories.order(:name)
        render json: {
          categories: categories.map { |c|
            {
              id: c.id,
              name: c.name,
              auto_approve_limit: c.auto_approve_limit.to_f,
              is_active: c.is_active
            }
          }
        }, status: :ok
      end
    end
  end
end
