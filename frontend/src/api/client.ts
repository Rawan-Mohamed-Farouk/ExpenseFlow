import { User, Category, Expense, NotificationItem, PaginationMeta, ReportBreakdownItem, ReportSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('expenseflow_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('expenseflow_token');
      localStorage.removeItem('expenseflow_user');
      window.dispatchEvent(new Event('expenseflow_unauthorized'));
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || 'Unauthorized. Please sign in again.');
    }

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg =
        errorJson.error ||
        (Array.isArray(errorJson.errors) ? errorJson.errors.join(', ') : 'An unexpected error occurred.');
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'DELETE',
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/me');
  }

  // Categories
  async getCategories(): Promise<{ categories: Category[] }> {
    return this.request('/categories');
  }

  // Expenses
  async getExpenses(params: {
    status?: string;
    category_id?: number | string;
    start_date?: string;
    end_date?: string;
    search?: string;
    scope?: 'my' | 'all';
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }): Promise<{ expenses: Expense[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query.append(key, String(val));
      }
    });
    return this.request(`/expenses?${query.toString()}`);
  }

  async getExpense(id: number): Promise<{ expense: Expense }> {
    return this.request(`/expenses/${id}`);
  }

  async createExpense(data: {
    title: string;
    description?: string;
    amount: number;
    spent_date: string;
    category_id: number;
  }): Promise<{ expense: Expense; message: string }> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify({ expense: data }),
    });
  }

  async updateExpense(
    id: number,
    data: {
      title?: string;
      description?: string;
      amount?: number;
      spent_date?: string;
      category_id?: number;
    }
  ): Promise<{ expense: Expense; message: string }> {
    return this.request(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ expense: data }),
    });
  }

  async deleteExpense(id: number): Promise<{ message: string }> {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async submitExpense(id: number): Promise<{ expense: Expense; message: string }> {
    return this.request(`/expenses/${id}/submit`, {
      method: 'POST',
    });
  }

  async reopenExpense(id: number): Promise<{ expense: Expense; message: string }> {
    return this.request(`/expenses/${id}/reopen`, {
      method: 'POST',
    });
  }

  // Review Queue
  async getReviewQueue(): Promise<{ expenses: Expense[]; count: number }> {
    return this.request('/review_queue');
  }

  async approveExpense(id: number, comment?: string): Promise<{ expense: Expense; message: string }> {
    return this.request(`/expenses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async rejectExpense(id: number, comment: string): Promise<{ expense: Expense; message: string }> {
    return this.request(`/expenses/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // Reimbursements
  async getReimbursements(): Promise<{ expenses: Expense[]; count: number }> {
    return this.request('/reimbursements');
  }

  async reimburseExpense(id: number, payment_reference: string): Promise<{ expense: Expense; message: string }> {
    return this.request(`/expenses/${id}/reimburse`, {
      method: 'POST',
      body: JSON.stringify({ payment_reference }),
    });
  }

  // Reports
  async getReports(params: {
    start_date?: string;
    end_date?: string;
  }): Promise<{ summary: ReportSummary; breakdown: ReportBreakdownItem[] }> {
    const query = new URLSearchParams();
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    return this.request(`/reports?${query.toString()}`);
  }

  getReportsCsvUrl(params: { start_date?: string; end_date?: string }): string {
    const token = this.getToken();
    const query = new URLSearchParams();
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    query.append('format', 'csv');
    return `${API_BASE_URL}/reports?${query.toString()}`;
  }

  async downloadReportsCsv(params: { start_date?: string; end_date?: string }): Promise<void> {
    const token = this.getToken();
    const query = new URLSearchParams();
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    query.append('format', 'csv');

    const response = await fetch(`${API_BASE_URL}/reports?${query.toString()}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) throw new Error('Failed to download CSV report');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${params.start_date || 'all'}-to-${params.end_date || 'today'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
    return this.request('/notifications');
  }

  async markNotificationRead(id: number): Promise<{ message: string }> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead(): Promise<{ message: string }> {
    return this.request('/notifications/mark_all_read', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
