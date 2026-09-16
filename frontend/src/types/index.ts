export type UserRole = 'employee' | 'manager' | 'admin';

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  team?: {
    id: number;
    name: string;
  } | null;
  managed_team?: {
    id: number;
    name: string;
  } | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  auto_approve_limit: number;
  is_active: boolean;
  expenses_count?: number;
}

export interface ExpenseHistory {
  id: number;
  actor_type: 'user' | 'system';
  actor_name: string;
  actor_id?: number | null;
  previous_status: ExpenseStatus | null;
  new_status: ExpenseStatus;
  comment?: string | null;
  created_at: string;
}

export interface Expense {
  id: number;
  title: string;
  description?: string | null;
  amount: number;
  spent_date: string;
  status: ExpenseStatus;
  payment_reference?: string | null;
  submitted_at?: string | null;
  reimbursed_at?: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    team_name?: string | null;
  };
  category: {
    id: number;
    name: string;
    auto_approve_limit: number;
    is_active: boolean;
  };
  allowed_actions: string[];
  histories?: ExpenseHistory[];
}

export interface NotificationItem {
  id: number;
  expense_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export interface ReportBreakdownItem {
  month: string;
  category_id: number;
  category_name: string;
  approved_count: number;
  approved_amount: number;
  reimbursed_count: number;
  reimbursed_amount: number;
  total_count: number;
  total_amount: number;
}

export interface ReportSummary {
  start_date: string;
  end_date: string;
  total_approved_amount: number;
  total_approved_count: number;
  total_reimbursed_amount: number;
  total_reimbursed_count: number;
  grand_total_amount: number;
  grand_total_count: number;
}
