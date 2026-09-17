module Api
  module V1
    class ReimbursementsController < ApplicationController
      before_action :require_admin!
      before_action :set_expense, only: [:reimburse]

      # GET /api/v1/reimbursements
      def index
        expenses = Expense.approved.includes(:user, :category, :expense_histories).order(created_at: :asc)
        render json: {
          expenses: expenses.map { |e| serialize_expense(e) },
          count: expenses.count
        }, status: :ok
      end

      # POST /api/v1/expenses/:id/reimburse
      def reimburse
        payment_reference = params[:payment_reference]
        if payment_reference.blank?
          return render json: { error: "Payment reference is required to mark an expense as reimbursed." }, status: :unprocessable_entity
        end

        begin
          ExpenseService::Reimburse.call(@expense, current_user, payment_reference)
          render json: { expense: serialize_expense(@expense, detailed: true), message: "Expense successfully marked as reimbursed." }, status: :ok
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
