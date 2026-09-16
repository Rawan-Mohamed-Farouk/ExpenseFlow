# ExpenseFlow — Team Expense Reimbursement Platform

ExpenseFlow is a multi-role team expense reimbursement platform built with **Ruby on Rails (API mode)**, **PostgreSQL**, and **React + TypeScript (Vite)**.

---

## 🚀 Quick Start (Single Docker Command)

Start the entire application (PostgreSQL, Rails API with database setup & seeds, and React Vite app) with a single command:

```bash
docker compose up --build
```

Once running:
- **Web Application (React UI)**: [http://localhost:5173](http://localhost:5173)
- **API Server (Rails API)**: [http://localhost:3000](http://localhost:3000)
- **Health Check**: [http://localhost:3000/up](http://localhost:3000/up)

---

## 👥 Demo Credentials & Personas

The seed script automatically populates users across every role and expenses across all workflow states. Password for all demo accounts is **`password123`**.

| Persona | Role | Email | Responsibilities & Test Scenarios |
| :--- | :--- | :--- | :--- |
| **Alice Chen** | `employee` | `alice@expenseflow.com` | Creates & submits expenses. Has draft, auto-approved, rejected, and reimbursed expenses. |
| **Bob Miller** | `employee` | `bob@expenseflow.com` | Engineering team member with draft, submitted, and approved expenses. |
| **Carol Davis** | `employee` | `carol@expenseflow.com` | Marketing team member with submitted software subscription expense. |
| **Alex Lead** | `manager` | `manager.eng@expenseflow.com` | Manages Engineering team. Reviews Alice & Bob expenses. Has submitted own expenses awaiting Admin review. |
| **Maria Lead** | `manager` | `manager.mkt@expenseflow.com` | Manages Marketing team. Reviews Carol's expenses. |
| **Sarah Admin** | `admin` | `admin@expenseflow.com` | Finance Admin. Reviews manager expenses, processes reimbursements, and views monthly financial reports. |
| **James Finance** | `admin` | `admin2@expenseflow.com` | Second Finance Admin. Reviews Sarah's expenses (peer review) and manages reimbursements. |
| **Dave Inactive**| `employee` | `dave.inactive@expenseflow.com` | **Deactivated account**. Demonstrates immediate login rejection and access blocking. |

> 💡 *Tip: The UI features a **"Switch Demo User"** quick-picker in the header for effortless switching between roles during review!*

---

## 🔑 Authentication Approach

As specified in section 3.1:
1. **Custom Implementation**: Implemented from scratch using Rails `has_secure_password` (bcrypt) and stateless **JSON Web Tokens (JWT)** signed with HMAC-SHA256. Devise and external identity providers are not used.
2. **Session Security & Immediate Deactivation Enforcement**:
   - Each issued token encodes the user ID and role with a 24-hour expiration.
   - On every authenticated API request, the `ApplicationController` decodes the token and verifies that the user exists and **`user.is_active? == true`**.
   - If an administrator deactivates a user, their access is revoked **immediately** on the very next request (returns `401 Unauthorized`).
3. **Required Endpoints**:
   - `POST /api/v1/auth/login`: Verifies credentials and returns `{ token, user }`.
   - `DELETE /api/v1/auth/logout`: Invalidates client session.
   - `GET /api/v1/me`: Returns the authenticated user's current profile, role, and team details.

---

## 💼 Core Workflow & Business Logic

### State Transitions
```
                [ reopen (owner) ]
          ┌───────────────────────────┐
          │                           │
          ▼                           │
      [ draft ] ──────submit─────► [ submitted ] ───approve (reviewer)──► [ approved ] ───reimburse (admin)──► [ reimbursed ]
          │        (owner)            │
          │                           ├───reject (reviewer)──► [ rejected ]
          │                           │
          └───── auto-approve ────────┘
           (amount <= category limit)
```

1. **Submission & Auto-Approval (3.6)**:
   - When an expense is submitted, if `amount <= category.auto_approve_limit`, the system auto-approves it instantly (`status: approved`, `actor: "System"`).
   - Otherwise, the expense enters `submitted` status and routes to the appropriate reviewer.
2. **Review Hierarchy (2.0)**:
   - **Employees**: Reviewed by their Team Manager.
   - **Managers**: Reviewed by an Admin (managers can never review their own claims).
   - **Admins**: Reviewed by a *different* Admin.
   - Rejections **strictly require** a detailed comment.
3. **Reimbursement (3.5)**:
   - Approved expenses are marked as reimbursed by Finance Admins, **requiring** a payment reference (e.g. `WIRE-2026-9821` / `ACH-5541`).
4. **Immutable Audit History (3.5)**:
   - Every state transition creates an uneditable history entry (`expense_histories`) recording the actor (or System), previous state, new state, comment, and timestamp.
5. **In-App Notifications (3.5)**:
   - State changes trigger real-time in-app notification records for expense owners with read/unread tracking.

---

## 📊 Reports & Bonus Features

1. **Monthly Category Financial Intelligence**:
   - Dynamic aggregation of approved and reimbursed expenses grouped by month (YYYY-MM) and category.
   - Date range filters with quick presets (Last 30 Days, Last 90 Days, Year to Date).
2. **CSV Export**:
   - One-click CSV export via `GET /api/v1/reports?format=csv` downloading formatted financial statements.
3. **TypeScript on Frontend**:
   - Fully typed React frontend using Vite, TypeScript interfaces, and strict type checking.

---

## 🛠️ Local Development (Without Docker)

### Backend Setup (Rails 8 API)
```bash
cd backend
bundle install
bundle exec rails db:create db:migrate db:seed
bundle exec rails s -p 3000
```

### Running Backend Tests (RSpec)
```bash
cd backend
bundle exec rspec
```

### Frontend Setup (React + TypeScript)
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 Documentation
- **Entity Relationship Diagram (ERD)**: [docs/ERD.md](file:///Users/User/.gemini/antigravity-ide/scratch/expenseflow/docs/ERD.md)
- **REST API Specification**: [docs/API.md](file:///Users/User/.gemini/antigravity-ide/scratch/expenseflow/docs/API.md)

---

## 💡 Assumptions & Future Improvements

### Assumptions Made:
1. **Currencies**: All transactions are in a single company currency ($ USD) per section 3.4.
2. **Manager Reassignment**: If an employee has no manager assigned (unassigned team), submitted expenses route to Admins for review.
3. **Date Restrictions**: Expenses must have a spent date within the past 90 days and cannot be in the future.

### With More Time:
- Multi-currency support with live exchange rates.
- Receipt OCR scanning & file attachment uploads (via ActiveStorage & S3).
- Configurable multi-level approval workflows (e.g. Manager approval + VP Finance approval for claims > $5,000).
- Push notifications / WebSockets (ActionCable) for live notification delivery.
