# ExpenseFlow Entity-Relationship Diagram (ERD)

Below is the database architecture and entity relationships for ExpenseFlow.

## Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ EXPENSES : "owns"
    USERS ||--o{ EXPENSE_HISTORIES : "acts in"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS }o--|| TEAMS : "belongs to"
    USERS ||--o| TEAMS : "manages"
    
    CATEGORIES ||--o{ EXPENSES : "classifies"
    
    EXPENSES ||--o{ EXPENSE_HISTORIES : "tracks audit trail"
    EXPENSES ||--o{ NOTIFICATIONS : "triggers"

    USERS {
        bigint id PK
        string name "not null"
        string email "not null, unique"
        string password_digest "not null"
        string role "employee | manager | admin, not null"
        bigint team_id FK "nullable"
        boolean is_active "default true, not null"
        datetime created_at
        datetime updated_at
    }

    TEAMS {
        bigint id PK
        string name "unique, not null"
        bigint manager_id FK "not null, references users(id)"
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        bigint id PK
        string name "unique (case-insensitive), not null"
        decimal auto_approve_limit "precision 10 scale 2, default 0.0"
        boolean is_active "default true, not null"
        datetime created_at
        datetime updated_at
    }

    EXPENSES {
        bigint id PK
        bigint user_id FK "not null, references users(id)"
        bigint category_id FK "not null, references categories(id)"
        string title "not null"
        text description
        decimal amount "precision 10 scale 2, not null (>0 and <=100000)"
        date spent_date "not null (<= today and >= submitted_at - 90d)"
        string status "draft | submitted | approved | rejected | reimbursed"
        string payment_reference "nullable, required when reimbursed"
        datetime submitted_at
        datetime reimbursed_at
        datetime created_at
        datetime updated_at
    }

    EXPENSE_HISTORIES {
        bigint id PK
        bigint expense_id FK "not null, on_delete cascade"
        bigint actor_id FK "nullable, references users(id)"
        string actor_type "user | system, not null"
        string actor_name "not null"
        string previous_status "nullable"
        string new_status "not null"
        text comment "nullable, required on rejection"
        datetime created_at "not null, immutable"
    }

    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK "not null, references users(id), on_delete cascade"
        bigint expense_id FK "not null, references expenses(id), on_delete cascade"
        string message "not null"
        boolean is_read "default false, not null"
        datetime created_at "not null"
    }
```

## Data Model Design Highlights

1. **Self-Referential User & Team Hierarchy**:
   - Every user belongs to at most one team (`team_id`).
   - Every team has exactly one manager (`manager_id` on `teams` foreign key referencing `users`).
   - A model validation enforces that a team's manager must have the `manager` role.
2. **Auto-Approval Rules**:
   - `categories.auto_approve_limit` enables instantaneous system approval when `expense.amount <= auto_approve_limit` upon submission.
3. **Immutable Audit Trail (`expense_histories`)**:
   - Records every state transition, who made it (`user` or `system`), previous status, new status, reviewer comments / rejection reasons / payment reference, and timestamp.
   - Guarded by model hooks preventing modification or deletion.
4. **Instant In-App Notifications (`notifications`)**:
   - When an expense state changes, notification records are generated for the expense owner.
