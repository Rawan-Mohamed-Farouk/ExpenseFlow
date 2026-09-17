module Api
  module V1
    class ReviewsController < ApplicationController
      before_action :require_manager_or_admin!
      before_action :set_expense, only: [:approve, :reject]

      # GET /api/v1/review_queue
      def queue
        expenses = current_user.reviewable_expenses.includes(:user, :category, :expense_histories).order(submitted_at: :asc)
        render json: {
          expenses: expenses.map { |e| serialize_expense(e) },
          count: expenses.count
        }, status: :ok
      end

      # POST /api/v1/expenses/:id/approve
      def approve
        comment = params[:comment]
        begin
          ExpenseService::Review.call(@expense, current_user, :approve, comment)
          render json: { expense: serialize_expense(@expense, detailed: true), message: "Expense approved successfully." }, status: :ok
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/expenses/:id/reject
      def reject
        comment = params[:comment]
        if comment.blank?
          return render json: { error: "Rejection comment is required." }, status: :unprocessable_entity
        end

        begin
          ExpenseService::Review.call(@expense, current_user, :reject, comment)
          render json: { expense: serialize_expense(@expense, detailed: true), message: "Expense rejected." }, status: :ok
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      private

      def set_expense
        @expense = Expense.find_by(id: params[:id])
        unless @expense
          render json: { error: "Expense not found." }, status: :not_found
        end
      end
    end
  end
end
