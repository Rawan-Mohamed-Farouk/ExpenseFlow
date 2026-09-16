module Api
  module V1
    class ExpensesController < ApplicationController
      before_action :set_expense, only: [:show, :update, :destroy, :submit, :reopen]

      # GET /api/v1/expenses
      def index
        scope = if params[:scope] == "my"
                  current_user.expenses
                else
                  current_user.visible_expenses
                end

        scope = scope.includes(:user, :category, :expense_histories)

        # Filters
        scope = scope.where(status: params[:status]) if params[:status].present? && Expense::STATUSES.include?(params[:status])
        scope = scope.where(category_id: params[:category_id]) if params[:category_id].present?
        scope = scope.where("spent_date >= ?", params[:start_date]) if params[:start_date].present?
        scope = scope.where("spent_date <= ?", params[:end_date]) if params[:end_date].present?

        if params[:search].present?
          query = "%#{params[:search].strip.downcase}%"
          scope = scope.joins(:user).where("lower(expenses.title) LIKE ? OR lower(users.name) LIKE ?", query, query)
        end

        # Sorting
        sort_by = %w[spent_date amount created_at].include?(params[:sort_by]) ? params[:sort_by] : "created_at"
        sort_order = params[:sort_order]&.downcase == "asc" ? :asc : :desc
        scope = scope.order(sort_by => sort_order)

        # Pagination
        page = [params[:page].to_i, 1].max
        per_page = params[:per_page].to_i > 0 ? [params[:per_page].to_i, 100].min : 10
        total_count = scope.count
        total_pages = (total_count.to_f / per_page).ceil
        paginated_expenses = scope.offset((page - 1) * per_page).limit(per_page)

        render json: {
          expenses: paginated_expenses.map { |e| serialize_expense(e) },
          meta: {
            current_page: page,
            total_pages: total_pages,
            total_count: total_count,
            per_page: per_page
          }
        }, status: :ok
      end

      # GET /api/v1/expenses/:id
      def show
        unless can_view_expense?(@expense)
          return render json: { error: "Not authorized to view this expense." }, status: :forbidden
        end

        render json: { expense: serialize_expense(@expense, detailed: true) }, status: :ok
      end

      # POST /api/v1/expenses
      def create
        category = Category.find_by(id: expense_params[:category_id])
        if category.nil? || !category.is_active?
          return render json: { error: "Selected category is inactive or does not exist." }, status: :unprocessable_entity
        end

        @expense = current_user.expenses.build(expense_params)
        @expense.status = "draft"

        Expense.transaction do
          if @expense.save
            @expense.expense_histories.create!(
              actor: current_user,
              actor_type: "user",
              actor_name: current_user.name,
              previous_status: nil,
              new_status: "draft",
              comment: "Created draft expense",
              created_at: Time.current
            )
            render json: { expense: serialize_expense(@expense, detailed: true), message: "Draft expense created successfully." }, status: :created
          else
            render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end

      # PATCH /api/v1/expenses/:id
      def update
        unless @expense.can_edit_or_delete?(current_user)
          return render json: { error: "Only the owner can edit an expense in draft status." }, status: :forbidden
        end

        if expense_params[:category_id].present?
          category = Category.find_by(id: expense_params[:category_id])
          if category.nil? || !category.is_active?
            return render json: { error: "Selected category is inactive or does not exist." }, status: :unprocessable_entity
          end
        end

        if @expense.update(expense_params)
          render json: { expense: serialize_expense(@expense, detailed: true), message: "Expense updated successfully." }, status: :ok
        else
          render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/expenses/:id
      def destroy
        unless @expense.can_edit_or_delete?(current_user)
          return render json: { error: "Only the owner can delete an expense in draft status." }, status: :forbidden
        end

        @expense.destroy
        render json: { message: "Expense deleted successfully." }, status: :ok
      end

      # POST /api/v1/expenses/:id/submit
      def submit
        unless @expense.user_id == current_user.id
          return render json: { error: "Only the owner can submit an expense." }, status: :forbidden
        end

        unless @expense.draft?
          return render json: { error: "Only draft expenses can be submitted." }, status: :unprocessable_entity
        end

        begin
          @expense.submit!(current_user)
          render json: { expense: serialize_expense(@expense, detailed: true), message: "Expense submitted successfully." }, status: :ok
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/expenses/:id/reopen
      def reopen
        unless @expense.user_id == current_user.id
          return render json: { error: "Only the owner can reopen an expense." }, status: :forbidden
        end

        unless @expense.rejected?
          return render json: { error: "Only rejected expenses can be reopened." }, status: :unprocessable_entity
        end

        begin
          @expense.reopen!(current_user)
          render json: { expense: serialize_expense(@expense, detailed: true), message: "Expense reopened to draft." }, status: :ok
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

      def expense_params
        params.require(:expense).permit(:title, :description, :amount, :spent_date, :category_id)
      end

      def can_view_expense?(expense)
        return true if current_user.admin?
        return true if expense.user_id == current_user.id
        return true if current_user.manager? && current_user.managed_team.present? && expense.user.team_id == current_user.managed_team.id

        false
      end
    end
  end
end
