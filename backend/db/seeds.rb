puts "Seeding ExpenseFlow database..."

begin
  ActiveRecord::Base.connection.execute("TRUNCATE TABLE notifications, expense_histories, expenses, users, teams, categories RESTART IDENTITY CASCADE;")
rescue => e
  puts "Warning during truncate: #{e.message}"
end

# Create Categories
puts "Creating categories..."
cat_meals = Category.create!(
  name: "Meals & Entertainment",
  auto_approve_limit: 50.00,
  is_active: true
)

cat_travel = Category.create!(
  name: "Travel & Lodging",
  auto_approve_limit: 150.00,
  is_active: true
)

cat_software = Category.create!(
  name: "Software & Subscriptions",
  auto_approve_limit: 100.00,
  is_active: true
)

cat_hardware = Category.create!(
  name: "Equipment & Hardware",
  auto_approve_limit: 0.00, # All hardware requires manual review
  is_active: true
)

cat_legacy = Category.create!(
  name: "Legacy Relocation",
  auto_approve_limit: 0.00,
  is_active: false # Inactive category
)

# Create Users
puts "Creating users..."
admin1 = User.create!(
  name: "Sarah Admin",
  email: "admin@expenseflow.com",
  password: "password123",
  role: "admin",
  is_active: true
)

admin2 = User.create!(
  name: "James Finance",
  email: "admin2@expenseflow.com",
  password: "password123",
  role: "admin",
  is_active: true
)

manager_eng = User.create!(
  name: "Alex Engineering Lead",
  email: "manager.eng@expenseflow.com",
  password: "password123",
  role: "manager",
  is_active: true
)

manager_mkt = User.create!(
  name: "Maria Marketing Lead",
  email: "manager.mkt@expenseflow.com",
  password: "password123",
  role: "manager",
  is_active: true
)

# Create Teams
puts "Creating teams..."
team_eng = Team.create!(
  name: "Engineering",
  manager: manager_eng
)

team_mkt = Team.create!(
  name: "Marketing",
  manager: manager_mkt
)

# Create Employees
alice = User.create!(
  name: "Alice Chen",
  email: "alice@expenseflow.com",
  password: "password123",
  role: "employee",
  team: team_eng,
  is_active: true
)

bob = User.create!(
  name: "Bob Miller",
  email: "bob@expenseflow.com",
  password: "password123",
  role: "employee",
  team: team_eng,
  is_active: true
)

carol = User.create!(
  name: "Carol Davis",
  email: "carol@expenseflow.com",
  password: "password123",
  role: "employee",
  team: team_mkt,
  is_active: true
)

dave_inactive = User.create!(
  name: "Dave Inactive",
  email: "dave.inactive@expenseflow.com",
  password: "password123",
  role: "employee",
  team: team_eng,
  is_active: false
)

# Create Expenses across all states

puts "Creating expenses and workflow histories..."

# 1. DRAFT expenses (Alice & Bob)
draft_expense1 = Expense.create!(
  user: alice,
  category: cat_meals,
  title: "Client Lunch at Bistro",
  description: "Lunch meeting with prospect client to discuss enterprise plan.",
  amount: 42.50,
  spent_date: Date.current - 2.days,
  status: "draft"
)
draft_expense1.expense_histories.create!(
  actor: alice,
  actor_type: "user",
  actor_name: alice.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Created draft expense",
  created_at: 2.days.ago
)

draft_expense2 = Expense.create!(
  user: bob,
  category: cat_hardware,
  title: "Ergonomic Keyboard & Mouse",
  description: "Replacement keyboard for home office workspace.",
  amount: 119.99,
  spent_date: Date.current - 5.days,
  status: "draft"
)
draft_expense2.expense_histories.create!(
  actor: bob,
  actor_type: "user",
  actor_name: bob.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Created draft expense",
  created_at: 5.days.ago
)

# 2. SUBMITTED expenses waiting for review
# 2a. Bob's flight ticket -> waiting for Alex (Engineering Lead)
sub_expense_bob = Expense.create!(
  user: bob,
  category: cat_travel,
  title: "Flight to NYC Client Summit",
  description: "Roundtrip economy flight from SFO to JFK for client onboarding.",
  amount: 485.00,
  spent_date: Date.current - 7.days,
  status: "submitted",
  submitted_at: 6.days.ago
)
sub_expense_bob.expense_histories.create!(
  actor: bob,
  actor_type: "user",
  actor_name: bob.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Created draft",
  created_at: 7.days.ago
)
sub_expense_bob.expense_histories.create!(
  actor: bob,
  actor_type: "user",
  actor_name: bob.name,
  previous_status: "draft",
  new_status: "submitted",
  comment: "Submitted for manager review",
  created_at: 6.days.ago
)
sub_expense_bob.notifications.create!(
  user: bob,
  message: "Your expense 'Flight to NYC Client Summit' ($485.00) was submitted for review.",
  created_at: 6.days.ago
)

# 2b. Carol's marketing pass -> waiting for Maria (Marketing Lead)
sub_expense_carol = Expense.create!(
  user: carol,
  category: cat_software,
  title: "Social Analytics Annual License",
  description: "Team subscription for competitor social listening tools.",
  amount: 240.00,
  spent_date: Date.current - 4.days,
  status: "submitted",
  submitted_at: 3.days.ago
)
sub_expense_carol.expense_histories.create!(
  actor: carol,
  actor_type: "user",
  actor_name: carol.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Created draft",
  created_at: 4.days.ago
)
sub_expense_carol.expense_histories.create!(
  actor: carol,
  actor_type: "user",
  actor_name: carol.name,
  previous_status: "draft",
  new_status: "submitted",
  comment: "Submitted for manager approval",
  created_at: 3.days.ago
)
sub_expense_carol.notifications.create!(
  user: carol,
  message: "Your expense 'Social Analytics Annual License' ($240.00) was submitted for review.",
  created_at: 3.days.ago
)

# 2c. Manager's expense (Alex) -> waiting for Admin review
sub_expense_alex = Expense.create!(
  user: manager_eng,
  category: cat_travel,
  title: "Hotel at RailsConf 2026",
  description: "3 nights hotel stay during Rails conference.",
  amount: 620.00,
  spent_date: Date.current - 8.days,
  status: "submitted",
  submitted_at: 7.days.ago
)
sub_expense_alex.expense_histories.create!(
  actor: manager_eng,
  actor_type: "user",
  actor_name: manager_eng.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Draft created",
  created_at: 8.days.ago
)
sub_expense_alex.expense_histories.create!(
  actor: manager_eng,
  actor_type: "user",
  actor_name: manager_eng.name,
  previous_status: "draft",
  new_status: "submitted",
  comment: "Submitted by manager (requires Admin review)",
  created_at: 7.days.ago
)
sub_expense_alex.notifications.create!(
  user: manager_eng,
  message: "Your expense 'Hotel at RailsConf 2026' ($620.00) was submitted for admin review.",
  created_at: 7.days.ago
)

# 2d. Admin's expense (James Finance) -> waiting for Sarah Admin review
sub_expense_james = Expense.create!(
  user: admin2,
  category: cat_meals,
  title: "Q3 Finance Team Dinner",
  description: "Quarterly wrap-up dinner with finance consultants.",
  amount: 175.50,
  spent_date: Date.current - 3.days,
  status: "submitted",
  submitted_at: 2.days.ago
)
sub_expense_james.expense_histories.create!(
  actor: admin2,
  actor_type: "user",
  actor_name: admin2.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Created draft",
  created_at: 3.days.ago
)
sub_expense_james.expense_histories.create!(
  actor: admin2,
  actor_type: "user",
  actor_name: admin2.name,
  previous_status: "draft",
  new_status: "submitted",
  comment: "Submitted by admin (requires peer Admin review)",
  created_at: 2.days.ago
)
sub_expense_james.notifications.create!(
  user: admin2,
  message: "Your expense 'Q3 Finance Team Dinner' ($175.50) was submitted for peer admin review.",
  created_at: 2.days.ago
)

# 3. APPROVED expenses (Auto-approved and Manager-approved)
# 3a. Auto-approved (Alice $35 meals <= $50 auto approve limit)
app_expense_auto = Expense.create!(
  user: alice,
  category: cat_meals,
  title: "Airport Coffee & Sandwich",
  description: "Breakfast while traveling to customer site.",
  amount: 32.75,
  spent_date: Date.current - 12.days,
  status: "approved",
  submitted_at: 11.days.ago
)
app_expense_auto.expense_histories.create!(
  actor: alice,
  actor_type: "user",
  actor_name: alice.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Created draft",
  created_at: 12.days.ago
)
app_expense_auto.expense_histories.create!(
  actor_type: "system",
  actor_name: "System",
  previous_status: "draft",
  new_status: "approved",
  comment: "Auto-approved: Amount ($32.75) is within category limit ($50.00)",
  created_at: 11.days.ago
)
app_expense_auto.notifications.create!(
  user: alice,
  message: "Your expense 'Airport Coffee & Sandwich' ($32.75) was automatically approved.",
  created_at: 11.days.ago
)

# 3b. Manager-approved (Bob's Cloud Hosting approved by Alex)
app_expense_manual = Expense.create!(
  user: bob,
  category: cat_software,
  title: "Cloud Infrastructure Staging Server",
  description: "Dedicated testing cluster for new microservices deployment.",
  amount: 290.00,
  spent_date: Date.current - 15.days,
  status: "approved",
  submitted_at: 14.days.ago
)
app_expense_manual.expense_histories.create!(
  actor: bob,
  actor_type: "user",
  actor_name: bob.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Created draft",
  created_at: 15.days.ago
)
app_expense_manual.expense_histories.create!(
  actor: bob,
  actor_type: "user",
  actor_name: bob.name,
  previous_status: "draft",
  new_status: "submitted",
  comment: "Submitted for approval",
  created_at: 14.days.ago
)
app_expense_manual.expense_histories.create!(
  actor: manager_eng,
  actor_type: "user",
  actor_name: manager_eng.name,
  previous_status: "submitted",
  new_status: "approved",
  comment: "Approved. Verified with engineering infrastructure budget.",
  created_at: 13.days.ago
)
app_expense_manual.notifications.create!(
  user: bob,
  message: "Your expense 'Cloud Infrastructure Staging Server' was approved by Alex Engineering Lead.",
  created_at: 13.days.ago
)

# 4. REJECTED expenses (Alice $1,250 luxury dinner rejected by Alex)
rej_expense = Expense.create!(
  user: alice,
  category: cat_meals,
  title: "Team VIP Tasting Menu Dinner",
  description: "Celebration dinner for launch milestone.",
  amount: 1250.00,
  spent_date: Date.current - 20.days,
  status: "rejected",
  submitted_at: 19.days.ago
)
rej_expense.expense_histories.create!(
  actor: alice,
  actor_type: "user",
  actor_name: alice.name,
  previous_status: nil,
  new_status: "draft",
  comment: "Draft created",
  created_at: 20.days.ago
)
rej_expense.expense_histories.create!(
  actor: alice,
  actor_type: "user",
  actor_name: alice.name,
  previous_status: "draft",
  new_status: "submitted",
  comment: "Submitted for manager review",
  created_at: 19.days.ago
)
rej_expense.expense_histories.create!(
  actor: manager_eng,
  actor_type: "user",
  actor_name: manager_eng.name,
  previous_status: "submitted",
  new_status: "rejected",
  comment: "Exceeds permissible per-person dinner limits ($100/person). Please itemize attendees and resubmit.",
  created_at: 18.days.ago
)
rej_expense.notifications.create!(
  user: alice,
  message: "Your expense 'Team VIP Tasting Menu Dinner' was rejected by Alex Engineering Lead: Exceeds permissible per-person dinner limits ($100/person). Please itemize attendees and resubmit.",
  created_at: 18.days.ago
)

# 5. REIMBURSED expenses (Alice & Bob)
reimb_expense1 = Expense.create!(
  user: alice,
  category: cat_travel,
  title: "Uber to SFO Airport",
  description: "Taxi ride to catch morning customer flight.",
  amount: 84.20,
  spent_date: Date.current - 25.days,
  status: "reimbursed",
  submitted_at: 24.days.ago,
  reimbursed_at: 22.days.ago,
  payment_reference: "WIRE-2026-9821"
)
reimb_expense1.expense_histories.create!(
  actor: alice,
  actor_type: "user",
  actor_name: alice.name,
  previous_status: nil,
  new_status: "draft",
  created_at: 25.days.ago
)
reimb_expense1.expense_histories.create!(
  actor_type: "system",
  actor_name: "System",
  previous_status: "draft",
  new_status: "approved",
  comment: "Auto-approved: Amount ($84.20) is within category limit ($150.00)",
  created_at: 24.days.ago
)
reimb_expense1.expense_histories.create!(
  actor: admin1,
  actor_type: "user",
  actor_name: admin1.name,
  previous_status: "approved",
  new_status: "reimbursed",
  comment: "Payment Reference: WIRE-2026-9821",
  created_at: 22.days.ago
)
reimb_expense1.notifications.create!(
  user: alice,
  message: "Your expense 'Uber to SFO Airport' has been reimbursed. Ref: WIRE-2026-9821",
  created_at: 22.days.ago
)

reimb_expense2 = Expense.create!(
  user: bob,
  category: cat_hardware,
  title: "4K Dual Monitor Desk Setup",
  description: "Secondary monitor and dual display arm.",
  amount: 549.00,
  spent_date: Date.current - 30.days,
  status: "reimbursed",
  submitted_at: 29.days.ago,
  reimbursed_at: 26.days.ago,
  payment_reference: "ACH-2026-5541"
)
reimb_expense2.expense_histories.create!(
  actor: bob,
  actor_type: "user",
  actor_name: bob.name,
  previous_status: nil,
  new_status: "draft",
  created_at: 30.days.ago
)
reimb_expense2.expense_histories.create!(
  actor: bob,
  actor_type: "user",
  actor_name: bob.name,
  previous_status: "draft",
  new_status: "submitted",
  comment: "Submitted for review",
  created_at: 29.days.ago
)
reimb_expense2.expense_histories.create!(
  actor: manager_eng,
  actor_type: "user",
  actor_name: manager_eng.name,
  previous_status: "submitted",
  new_status: "approved",
  comment: "Hardware request approved under WFH stipend.",
  created_at: 28.days.ago
)
reimb_expense2.expense_histories.create!(
  actor: admin2,
  actor_type: "user",
  actor_name: admin2.name,
  previous_status: "approved",
  new_status: "reimbursed",
  comment: "Payment Reference: ACH-2026-5541",
  created_at: 26.days.ago
)
reimb_expense2.notifications.create!(
  user: bob,
  message: "Your expense '4K Dual Monitor Desk Setup' has been reimbursed. Ref: ACH-2026-5541",
  created_at: 26.days.ago
)

puts "Seeding completed successfully!"
puts "Created #{User.count} users, #{Team.count} teams, #{Category.count} categories, #{Expense.count} expenses, and #{ExpenseHistory.count} history records."
