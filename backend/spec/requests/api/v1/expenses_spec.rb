require "rails_helper"

RSpec.describe "Expenses API", type: :request do
  let(:category) { Category.create!(name: "Meals", auto_approve_limit: 40.0, is_active: true) }
  let(:user) { User.create!(name: "Bob", email: "bob@test.com", password: "password", role: "employee") }
  let(:other_user) { User.create!(name: "Eve", email: "eve@test.com", password: "password", role: "employee") }

  describe "POST /api/v1/expenses" do
    it "creates a draft expense for current user" do
      post "/api/v1/expenses",
        params: {
          expense: {
            title: "Lunch with client",
            description: "Discussion on pricing",
            amount: 35.0,
            spent_date: Date.current - 1.day,
            category_id: category.id
          }
        },
        headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["expense"]["status"]).to eq("draft")
      expect(json["expense"]["amount"]).to eq(35.0)
    end
  end

  describe "POST /api/v1/expenses/:id/submit" do
    it "auto-approves expense below category limit on submit" do
      expense = Expense.create!(
        user: user,
        category: category,
        title: "Snack",
        amount: 25.0,
        spent_date: Date.current - 1.day,
        status: "draft"
      )

      post "/api/v1/expenses/#{expense.id}/submit", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["expense"]["status"]).to eq("approved")
    end

    it "moves to submitted if above limit" do
      expense = Expense.create!(
        user: user,
        category: category,
        title: "Big dinner",
        amount: 150.0,
        spent_date: Date.current - 1.day,
        status: "draft"
      )

      post "/api/v1/expenses/#{expense.id}/submit", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["expense"]["status"]).to eq("submitted")
    end

    it "forbids non-owner from submitting" do
      expense = Expense.create!(
        user: user,
        category: category,
        title: "Private expense",
        amount: 25.0,
        spent_date: Date.current - 1.day,
        status: "draft"
      )

      post "/api/v1/expenses/#{expense.id}/submit", headers: auth_headers(other_user)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
