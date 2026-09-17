require "rails_helper"

RSpec.describe "Reviews and Reports API", type: :request do
  let(:category) { Category.create!(name: "Software", auto_approve_limit: 50.0, is_active: true) }
  let(:manager) { User.create!(name: "Mgr Mark", email: "mark@test.com", password: "password", role: "manager") }
  let(:team) { Team.create!(name: "Product Team", manager: manager) }
  let(:employee) { User.create!(name: "Emp Emma", email: "emma@test.com", password: "password", role: "employee", team: team) }
  let(:other_manager) { User.create!(name: "Other Manager", email: "other-manager@test.com", password: "password", role: "manager") }
  let(:other_team) { Team.create!(name: "Other Team", manager: other_manager) }
  let(:other_employee) { User.create!(name: "Other Employee", email: "other-employee@test.com", password: "password", role: "employee", team: other_team) }
  let(:admin) { User.create!(name: "Admin Amy", email: "amy@test.com", password: "password", role: "admin") }
  let(:second_admin) { User.create!(name: "Admin Andy", email: "andy@test.com", password: "password", role: "admin") }

  describe "Review Queue & Review Actions" do
    let!(:submitted_expense) do
      Expense.create!(
        user: employee,
        category: category,
        title: "Team IDE Subscription",
        amount: 250.0,
        spent_date: Date.current - 2.days,
        status: "submitted",
        submitted_at: 1.day.ago
      )
    end

    it "shows submitted team member expenses in manager review queue" do
      get "/api/v1/review_queue", headers: auth_headers(manager)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["expenses"].length).to eq(1)
      expect(json["expenses"].first["id"]).to eq(submitted_expense.id)
    end

    it "allows manager to approve with optional comment" do
      post "/api/v1/expenses/#{submitted_expense.id}/approve",
        params: { comment: "Approved for team" },
        headers: auth_headers(manager)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["expense"]["status"]).to eq("approved")
    end

    it "requires comment when manager rejects" do
      post "/api/v1/expenses/#{submitted_expense.id}/reject",
        params: { comment: "" },
        headers: auth_headers(manager)

      expect(response).to have_http_status(:unprocessable_entity)

      post "/api/v1/expenses/#{submitted_expense.id}/reject",
        params: { comment: "Too expensive" },
        headers: auth_headers(manager)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["expense"]["status"]).to eq("rejected")
    end
  end

  describe "Reports & CSV Export" do
    before do
      Expense.create!(
        user: employee,
        category: category,
        title: "Past Item",
        amount: 100.0,
        spent_date: Date.current - 10.days,
        status: "approved"
      )
      Expense.create!(
        user: employee,
        category: category,
        title: "Reimbursed Item",
        amount: 200.0,
        spent_date: Date.current - 15.days,
        status: "reimbursed",
        payment_reference: "PAY-123"
      )
    end

    it "generates JSON report summary for admin" do
      get "/api/v1/reports", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["summary"]["grand_total_amount"]).to eq(300.0)
      expect(json["breakdown"]).to be_an(Array)
    end

    it "exports CSV report for admin" do
      get "/api/v1/reports.csv", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/csv")
      expect(response.body).to include("Software")
      expect(response.body).to include("Summary Totals")
    end

    it "forbids non-admin from accessing reports" do
      get "/api/v1/reports", headers: auth_headers(employee)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "reviewer authorization matrix" do
    it "does not allow a manager to review another team's employee" do
      expense = Expense.create!(user: other_employee, category: category, title: "Other team expense", amount: 250,
                                spent_date: Date.current - 1.day, status: "submitted", submitted_at: Time.current)

      post "/api/v1/expenses/#{expense.id}/approve", headers: auth_headers(manager)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "requires an admin for manager expenses" do
      expense = Expense.create!(user: manager, category: category, title: "Manager expense", amount: 250,
                                spent_date: Date.current - 1.day, status: "submitted", submitted_at: Time.current)

      post "/api/v1/expenses/#{expense.id}/approve", headers: auth_headers(manager)
      expect(response).to have_http_status(:unprocessable_entity)

      post "/api/v1/expenses/#{expense.id}/approve", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
    end

    it "requires a different admin for admin expenses" do
      expense = Expense.create!(user: admin, category: category, title: "Finance expense", amount: 250,
                                spent_date: Date.current - 1.day, status: "submitted", submitted_at: Time.current)

      post "/api/v1/expenses/#{expense.id}/approve", headers: auth_headers(admin)
      expect(response).to have_http_status(:unprocessable_entity)

      post "/api/v1/expenses/#{expense.id}/approve", headers: auth_headers(second_admin)
      expect(response).to have_http_status(:ok)
    end
  end
end
