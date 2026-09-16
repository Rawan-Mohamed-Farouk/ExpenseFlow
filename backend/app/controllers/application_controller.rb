class ApplicationController < ActionController::API
  before_action :authenticate_user!

  attr_reader :current_user

  private

  def authenticate_user!
    header = request.headers["Authorization"]
    token = header.split(" ").last if header.present?

    decoded = JsonWebToken.decode(token) if token.present?
    if decoded
      @current_user = User.find_by(id: decoded[:user_id])
      if @current_user.nil? || !@current_user.active?
        render json: { error: "Account is inactive or does not exist." }, status: :unauthorized
      end
    else
      render json: { error: "Unauthorized or session expired." }, status: :unauthorized
    end
  end

  def require_admin!
    unless current_user&.admin?
      render json: { error: "Forbidden: Admin access required." }, status: :forbidden
    end
  end

  def require_manager_or_admin!
    unless current_user&.manager? || current_user&.admin?
      render json: { error: "Forbidden: Manager or Admin access required." }, status: :forbidden
    end
  end

  def serialize_user(user)
    return nil if user.nil?

    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      team: user.team ? { id: user.team.id, name: user.team.name } : nil,
      managed_team: user.managed_team ? { id: user.managed_team.id, name: user.managed_team.name } : nil,
      created_at: user.created_at
    }
  end

  def serialize_expense(expense, detailed: false)
    data = {
      id: expense.id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount.to_f,
      spent_date: expense.spent_date,
      status: expense.status,
      payment_reference: expense.payment_reference,
      submitted_at: expense.submitted_at,
      reimbursed_at: expense.reimbursed_at,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
      user: {
        id: expense.user.id,
        name: expense.user.name,
        email: expense.user.email,
        role: expense.user.role,
        team_name: expense.user.team&.name
      },
      category: {
        id: expense.category.id,
        name: expense.category.name,
        auto_approve_limit: expense.category.auto_approve_limit.to_f,
        is_active: expense.category.is_active
      },
      allowed_actions: compute_allowed_actions(expense)
    }

    if detailed
      data[:histories] = expense.expense_histories.map do |h|
        {
          id: h.id,
          actor_type: h.actor_type,
          actor_name: h.actor_name,
          actor_id: h.actor_id,
          previous_status: h.previous_status,
          new_status: h.new_status,
          comment: h.comment,
          created_at: h.created_at
        }
      end
    end

    data
  end

  def compute_allowed_actions(expense)
    actions = []
    return actions unless current_user&.active?

    # Owner actions
    if current_user.id == expense.user_id
      if expense.draft?
        actions << "edit"
        actions << "delete"
        actions << "submit"
      elsif expense.rejected?
        actions << "reopen"
      end
    end

    # Reviewer actions
    if current_user.can_review?(expense)
      actions << "approve"
      actions << "reject"
    end

    # Reimburse action
    if current_user.admin? && expense.approved?
      actions << "reimburse"
    end

    actions
  end
end
