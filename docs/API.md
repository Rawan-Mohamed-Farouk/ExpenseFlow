# ExpenseFlow REST API Documentation

Base URL: `/api/v1`

All responses are in JSON format. Authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints

### 1.1 Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "alice@expenseflow.com",
  "password": "password123"
}
```
- **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 5,
    "name": "Alice Chen",
    "email": "alice@expenseflow.com",
    "role": "employee",
    "is_active": true,
    "team": { "id": 1, "name": "Engineering" },
    "managed_team": null
  }
}
```
- **Error (401 Unauthorized)**:
```json
{ "error": "Invalid email or password." }
```
```json
{ "error": "Your account has been deactivated. Please contact an administrator." }
```

### 1.2 Current User Profile
- **Endpoint**: `GET /api/v1/me`
- **Access**: Authenticated
- **Response (200 OK)**:
```json
{
  "user": {
    "id": 5,
    "name": "Alice Chen",
    "email": "alice@expenseflow.com",
    "role": "employee",
    "is_active": true,
    "team": { "id": 1, "name": "Engineering" },
    "managed_team": null
  }
}
```

### 1.3 Logout
- **Endpoint**: `DELETE /api/v1/auth/logout`
- **Access**: Authenticated
- **Response (200 OK)**:
```json
{ "message": "Successfully logged out." }
```

---

## 2. Categories

### 2.1 List Categories
- **Endpoint**: `GET /api/v1/categories`
- **Access**: Authenticated (returns active categories for employees/managers, all for admin)
- **Response (200 OK)**:
```json
{
  "categories": [
    { "id": 1, "name": "Meals & Entertainment", "auto_approve_limit": 50.0, "is_active": true },
    { "id": 2, "name": "Travel & Lodging", "auto_approve_limit": 150.0, "is_active": true }
  ]
}
```

---

## 3. Expenses

### 3.1 List Expenses
- **Endpoint**: `GET /api/v1/expenses`
- **Access**: Authenticated (scoped by user role: employee sees own, manager sees own + team, admin sees all)
- **Query Parameters**:
  - `status`: `draft`, `submitted`, `approved`, `rejected`, `reimbursed`
  - `category_id`: integer
  - `start_date`: `YYYY-MM-DD`
  - `end_date`: `YYYY-MM-DD`
  - `search`: string (matches title or user name)
  - `scope`: `my` (force own) or `all`
  - `sort_by`: `spent_date`, `amount`, `created_at` (default)
  - `sort_order`: `asc` or `desc` (default)
  - `page`: integer (default 1)
  - `per_page`: integer (default 10)
- **Response (200 OK)**:
```json
{
  "expenses": [
    {
      "id": 1,
      "title": "Client Lunch",
      "description": "Lunch meeting",
      "amount": 42.50,
      "spent_date": "2026-09-14",
      "status": "draft",
      "payment_reference": null,
      "submitted_at": null,
      "reimbursed_at": null,
      "user": { "id": 5, "name": "Alice Chen", "email": "alice@expenseflow.com", "role": "employee", "team_name": "Engineering" },
      "category": { "id": 1, "name": "Meals & Entertainment", "auto_approve_limit": 50.0, "is_active": true },
      "allowed_actions": ["edit", "delete", "submit"]
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 1,
    "per_page": 10
  }
}
```

### 3.2 Get Single Expense (Detailed with Audit History)
- **Endpoint**: `GET /api/v1/expenses/:id`
- **Access**: Authenticated (Owner, Manager of owner's team, or Admin)
- **Response (200 OK)**:
```json
{
  "expense": {
    "id": 1,
    "title": "Client Lunch",
    "description": "Lunch meeting",
    "amount": 42.50,
    "spent_date": "2026-09-14",
    "status": "draft",
    "payment_reference": null,
    "user": { "id": 5, "name": "Alice Chen", "email": "alice@expenseflow.com", "role": "employee" },
    "category": { "id": 1, "name": "Meals & Entertainment", "auto_approve_limit": 50.0, "is_active": true },
    "allowed_actions": ["edit", "delete", "submit"],
    "histories": [
      {
        "id": 1,
        "actor_type": "user",
        "actor_name": "Alice Chen",
        "actor_id": 5,
        "previous_status": null,
        "new_status": "draft",
        "comment": "Created draft expense",
        "created_at": "2026-09-14T12:00:00Z"
      }
    ]
  }
}
```

### 3.3 Create Draft Expense
- **Endpoint**: `POST /api/v1/expenses`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "expense": {
    "title": "Taxi to Airport",
    "description": "Travel to customer meeting",
    "amount": 45.00,
    "spent_date": "2026-09-15",
    "category_id": 2
  }
}
```
- **Response (201 Created)**

### 3.4 Update Draft Expense
- **Endpoint**: `PATCH /api/v1/expenses/:id`
- **Access**: Owner only (and only while `draft`)

### 3.5 Delete Draft Expense
- **Endpoint**: `DELETE /api/v1/expenses/:id`
- **Access**: Owner only (and only while `draft`)

### 3.6 Submit Expense
- **Endpoint**: `POST /api/v1/expenses/:id/submit`
- **Access**: Owner only (and only while `draft`)
- **Behavior**: If `amount <= category.auto_approve_limit`, transitions immediately to `approved` with actor `"System"`. Otherwise transitions to `submitted`.

### 3.7 Reopen Rejected Expense
- **Endpoint**: `POST /api/v1/expenses/:id/reopen`
- **Access**: Owner only (and only while `rejected`)
- **Behavior**: Transitions expense back to `draft`.

---

## 4. Review Queue & Approvals

### 4.1 Get Review Queue
- **Endpoint**: `GET /api/v1/review_queue`
- **Access**: Manager or Admin
- **Behavior**:
  - For Manager: returns submitted expenses of managed team members (never own).
  - For Admin: returns submitted expenses of managers and other admins.
- **Response (200 OK)**:
```json
{
  "expenses": [ ... ],
  "count": 2
}
```

### 4.2 Approve Expense
- **Endpoint**: `POST /api/v1/expenses/:id/approve`
- **Access**: Authorized Reviewer
- **Request Body**:
```json
{
  "comment": "Approved under Q3 project budget."
}
```

### 4.3 Reject Expense
- **Endpoint**: `POST /api/v1/expenses/:id/reject`
- **Access**: Authorized Reviewer
- **Request Body**:
```json
{
  "comment": "Exceeds per-diem limit. Please provide itemized breakdown."
}
```
*(Comment is required on rejection)*

---

## 5. Reimbursements (Admin Only)

### 5.1 List Approved Expenses for Payout
- **Endpoint**: `GET /api/v1/reimbursements`
- **Access**: Admin

### 5.2 Mark Expense as Reimbursed
- **Endpoint**: `POST /api/v1/expenses/:id/reimburse`
- **Access**: Admin
- **Request Body**:
```json
{
  "payment_reference": "WIRE-2026-9821"
}
```
*(Payment reference is required)*

---

## 6. Financial Reports (Admin Only)

### 6.1 Get Monthly Category Spending Summary
- **Endpoint**: `GET /api/v1/reports`
- **Access**: Admin
- **Query Parameters**: `start_date`, `end_date`, `format` (optional `csv`)
- **Response (200 OK - JSON)**:
```json
{
  "summary": {
    "start_date": "2026-04-01",
    "end_date": "2026-09-16",
    "total_approved_amount": 322.75,
    "total_approved_count": 2,
    "total_reimbursed_amount": 633.20,
    "total_reimbursed_count": 2,
    "grand_total_amount": 955.95,
    "grand_total_count": 4
  },
  "breakdown": [
    {
      "month": "2026-08",
      "category_id": 2,
      "category_name": "Travel & Lodging",
      "approved_count": 0,
      "approved_amount": 0.0,
      "reimbursed_count": 1,
      "reimbursed_amount": 84.20,
      "total_count": 1,
      "total_amount": 84.20
    }
  ]
}
```

### 6.2 Export Report as CSV
- **Endpoint**: `GET /api/v1/reports?format=csv` (or `GET /api/v1/reports.csv`)
- **Header**: `Accept: text/csv`
- **Response**: Downloadable `.csv` file with headers and totals.

---

## 7. In-App Notifications

### 7.1 List User Notifications
- **Endpoint**: `GET /api/v1/notifications`
- **Access**: Authenticated

### 7.2 Mark Notification as Read
- **Endpoint**: `PATCH /api/v1/notifications/:id/read`
- **Access**: Authenticated

### 7.3 Mark All Notifications Read
- **Endpoint**: `POST /api/v1/notifications/mark_all_read`
- **Access**: Authenticated
