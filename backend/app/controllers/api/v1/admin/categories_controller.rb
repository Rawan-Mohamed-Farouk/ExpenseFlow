module Api
  module V1
    module Admin
      class CategoriesController < ApplicationController
        before_action :require_admin!
        before_action :set_category, only: [:show, :update]

        # GET /api/v1/admin/categories
        def index
          categories = Category.order(:name)
          render json: {
            categories: categories.map { |c|
              {
                id: c.id,
                name: c.name,
                auto_approve_limit: c.auto_approve_limit.to_f,
                is_active: c.is_active,
                expenses_count: c.expenses.count
              }
            }
          }, status: :ok
        end

        # GET /api/v1/admin/categories/:id
        def show
          render json: {
            category: {
              id: @category.id,
              name: @category.name,
              auto_approve_limit: @category.auto_approve_limit.to_f,
              is_active: @category.is_active
            }
          }, status: :ok
        end

        # POST /api/v1/admin/categories
        def create
          category = Category.new(category_params)
          if category.save
            render json: { category: category, message: "Category created successfully." }, status: :created
          else
            render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/admin/categories/:id
        def update
          if @category.update(category_params)
            render json: { category: @category, message: "Category updated successfully." }, status: :ok
          else
            render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_category
          @category = Category.find_by(id: params[:id])
          unless @category
            render json: { error: "Category not found." }, status: :not_found
          end
        end

        def category_params
          params.require(:category).permit(:name, :auto_approve_limit, :is_active)
        end
      end
    end
  end
end
