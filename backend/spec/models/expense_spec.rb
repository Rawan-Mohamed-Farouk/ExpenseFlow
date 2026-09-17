require "rails_helper"

RSpec.describe Expense, type: :model do
  let(:category_meals) { Category.create!(name: "Meals", auto_approve_limit: 50.0, is_active: true) }
  let(:category_travel) { Category.create!(name: "Travel", auto_approve_limit: 100.0, is_active: true) }
  let(:category_inactive) { Category.create!(name: "Legacy", auto_approve_limit: 0.0, is_active: false) }

  let(:manager) { User.create!(name: "Manager Dan", email: "dan@test.com", password: "password", role: "manager") }
  let(:team) { Team.create!(name: "Dev Team", manager: manager) }
  let(:employee) { User.create!(name: "Employee Eve", email: "eve@test.com", password: "password", role: "employee", team: team) }
  let(:admin1) { User.create!(name: "Admin Ann", email: "ann@test.com", password: "password", role: "admin") }
  let(:admin2) { User.create!(name: "Admin Art", email: "art@test.com", password: "password", role: "admin") }

  describe "Validations" do
    it "is valid with valid attributes" do
      expense = Expense.new(
        user: employee,
        category: category_meals,
        title: "Team lunch",
        amount: 30.0,
        spent_date: Date.current - 5.days
      )
      expect(expense).to be_valid
    end

    it "rejects amount <= 0 or > 100,000" do
      exp_zero = Expense.new(user: employee, category: category_meals, title: "Zero", amount: 0, spent_date: Date.current)
      expect(exp_zero).not_to be_valid

      exp_too_high = Expense.new(user: employee, category: category_meals, title: "High", amount: 100_001, spent_date: Date.current)
      expect(exp_too_high).not_to be_valid
    end

    it "rejects spent_date in the future" do
      exp_future = Expense.new(user: employee, category: category_meals, title: "Future", amount: 50, spent_date: Date.current + 2.days)
      expect(exp_future).not_to be_valid
      expect(exp_future.errors[:spent_date]).to include("cannot be in the future")
    end

    it "rejects spent_date more than 90 days in the past" do
      exp_old = Expense.new(user: employee, category: category_meals, title: "Old", amount: 50, spent_date: Date.current - 95.days)
      exp_old.submitted_at = Time.current
      expect(exp_old).not_to be_valid
      expect(exp_old.errors[:spent_date]).to include("cannot be more than 90 days before submission date")
    end

    it "allows an old draft until submission" do
      old_draft = Expense.new(user: employee, category: category_meals, title: "Old draft", amount: 50,
                              spent_date: Date.current - 95.days, status: "draft")
      expect(old_draft).to be_valid
    end

    it "rejects inactive category on creation" do
      exp_inactive = Expense.new(user: employee, category: category_inactive, title: "Inactive", amount: 50, spent_date: Date.current)
      expect(exp_inactive).not_to be_valid
      expect(exp_inactive.errors[:category]).to include("must be active")
    end
  end

  describe "Workflow & Auto-approval" do
    it "auto-approves on submit if amount <= category auto_approve_limit" do
      expense = Expense.create!(
        user: employee,
        category: category_meals, # limit 50.0
        title: "Quick snack",
        amount: 25.0,
        spent_date: Date.current - 1.day,
        status: "draft"
      )

      expense.submit!(employee)
      expect(expense.reload.status).to eq("approved")
      expect(expense.expense_histories.last.actor_type).to eq("system")
      expect(expense.expense_histories.last.new_status).to eq("approved")
      expect(employee.notifications.count).to eq(1)
    end

    it "moves to submitted if amount > category auto_approve_limit" do
      expense = Expense.create!(
        user: employee,
        category: category_meals, # limit 50.0
        title: "Fancy dinner",
        amount: 150.0,
        spent_date: Date.current - 1.day,
        status: "draft"
      )

      expense.submit!(employee)
      expect(expense.reload.status).to eq("submitted")
      expect(expense.expense_histories.last.actor_type).to eq("user")
      expect(expense.expense_histories.last.new_status).to eq("submitted")
    end

    it "allows team manager to approve submitted expense" do
      expense = Expense.create!(
        user: employee,
        category: category_travel,
        title: "Taxi",
        amount: 250.0,
        spent_date: Date.current - 2.days,
        status: "submitted",
        submitted_at: 1.day.ago
      )

      expect(manager.can_review?(expense)).to be true
      expense.approve!(manager, "Looks good")
      expect(expense.reload.status).to eq("approved")
      expect(expense.expense_histories.last.actor).to eq(manager)
    end

    it "allows team manager to reject with comment, but fails without comment" do
      expense = Expense.create!(
        user: employee,
        category: category_travel,
        title: "Taxi",
        amount: 250.0,
        spent_date: Date.current - 2.days,
        status: "submitted",
        submitted_at: 1.day.ago
      )

      expect {
        expense.reject!(manager, "")
      }.to raise_error(StandardError, /comment is required/i)

      expense.reject!(manager, "Please provide receipt")
      expect(expense.reload.status).to eq("rejected")
    end

    it "allows owner to reopen rejected expense to draft" do
      expense = Expense.create!(
        user: employee,
        category: category_travel,
        title: "Taxi",
        amount: 250.0,
        spent_date: Date.current - 2.days,
        status: "rejected"
      )

      expense.reopen!(employee)
      expect(expense.reload.status).to eq("draft")
    end

    it "allows admin to reimburse approved expense with payment reference" do
      expense = Expense.create!(
        user: employee,
        category: category_travel,
        title: "Taxi",
        amount: 80.0,
        spent_date: Date.current - 2.days,
        status: "approved"
      )

      expect {
        expense.reimburse!(admin1, "")
      }.to raise_error(StandardError, /payment reference is required/i)

      expense.reimburse!(admin1, "PAY-999")
      expect(expense.reload.status).to eq("reimbursed")
      expect(expense.payment_reference).to eq("PAY-999")
    end
  end

  describe "Reviewer Authorization Rules" do
    it "prevents manager from reviewing their own expense" do
      mgr_expense = Expense.create!(
        user: manager,
        category: category_travel,
        title: "Hotel",
        amount: 300.0,
        spent_date: Date.current - 1.day,
        status: "submitted"
      )

      expect(manager.can_review?(mgr_expense)).to be false
      expect(admin1.can_review?(mgr_expense)).to be true
    end

    it "prevents admin from reviewing their own expense, but another admin can review it" do
      admin_expense = Expense.create!(
        user: admin1,
        category: category_travel,
        title: "Admin flight",
        amount: 400.0,
        spent_date: Date.current - 1.day,
        status: "submitted"
      )

      expect(admin1.can_review?(admin_expense)).to be false
      expect(admin2.can_review?(admin_expense)).to be true
    end
  end
end
