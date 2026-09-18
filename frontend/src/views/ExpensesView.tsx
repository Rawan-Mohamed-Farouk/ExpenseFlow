import React, { useState, useEffect } from 'react';
import { Expense, Category, PaginationMeta, ExpenseStatus } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  Plus,
  Search,
  DollarSign,
  Receipt,
  FileCheck,
  Clock,
  Banknote,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface ExpensesViewProps {
  onOpenCreate: () => void;
  onOpenDetail: (id: number) => void;
  categories: Category[];
  refreshKey?: number;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenCreate,
  onOpenDetail,
  categories,
  refreshKey = 0,
}) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 10,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [page, setPage] = useState(1);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.getExpenses({
        search: search || undefined,
        status: status || undefined,
        category_id: categoryId || undefined,
        scope: scope,
        page,
        per_page: 10,
      });
      setExpenses(res.expenses);
      setMeta(res.meta);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [search, status, categoryId, scope, page, refreshKey]);

  // Reset pagination when filter changes
  const handleFilterChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setPage(1);
  };

  // Compute KPI summary
  const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const draftCount = expenses.filter((e) => e.status === 'draft').length;
  const submittedCount = expenses.filter((e) => e.status === 'submitted').length;
  const approvedCount = expenses.filter((e) => e.status === 'approved' || e.status === 'reimbursed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & New Expense Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white)' }}>
            Expense Reimbursements
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Track, submit, and manage company expense claims
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <div
              style={{
                background: 'var(--bg-elevated)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '2px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => handleFilterChange(setScope, 'my')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: scope === 'my' ? '700' : '500',
                  background: scope === 'my' ? 'var(--primary)' : 'transparent',
                  color: scope === 'my' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                My Expenses
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange(setScope, 'all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: scope === 'all' ? '700' : '500',
                  background: scope === 'all' ? 'var(--primary)' : 'transparent',
                  color: scope === 'all' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {user.role === 'admin' ? 'All Company Expenses' : 'Team Expenses'}
              </button>
            </div>
          )}

          <button type="button" onClick={onOpenCreate} className="btn btn-primary">
            <Plus size={18} /> New Expense
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', textTransform: 'uppercase' }}>Current Page Total</span>
            <DollarSign size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            ${totalAmount.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{meta.total_count} total records</span>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', textTransform: 'uppercase' }}>Drafts Pending</span>
            <Clock size={18} color="var(--status-draft-text)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white)', marginTop: '8px' }}>
            {draftCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ready for submission</span>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', textTransform: 'uppercase' }}>Under Review</span>
            <Receipt size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-amber)', marginTop: '8px' }}>
            {submittedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting decision</span>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', textTransform: 'uppercase' }}>Approved / Paid</span>
            <FileCheck size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-emerald)', marginTop: '8px' }}>
            {approvedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed or pending payout</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by title or person..."
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          className="select-field"
          style={{ width: 'auto', minWidth: '150px' }}
          value={status}
          onChange={(e) => handleFilterChange(setStatus, e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="reimbursed">Reimbursed</option>
        </select>

        {/* Category Filter */}
        <select
          className="select-field"
          style={{ width: 'auto', minWidth: '170px' }}
          value={categoryId}
          onChange={(e) => handleFilterChange(setCategoryId, e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

      </div>

      {/* Expenses Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px' }}>Expense Title</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px' }}>Spent Date</th>
                {scope === 'all' && <th style={{ padding: '14px 16px' }}>Submitter</th>}
                <th style={{ padding: '14px 16px' }}>Amount</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={scope === 'all' ? 7 : 6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={scope === 'all' ? 7 : 6} style={{ padding: '56px 20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '600' }}>
                      No expenses found matching your criteria.
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '6px' }}>
                      Try adjusting your filters or create a new expense claim.
                    </p>
                    <button type="button" onClick={onOpenCreate} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                      <Plus size={14} /> Create Expense
                    </button>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => onOpenDetail(expense.id)}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-white)' }}>{expense.title}</div>
                      {expense.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                          {expense.description}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px 16px' }}>
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {expense.category.name}
                      </span>
                    </td>

                    <td style={{ padding: '16px 16px', color: 'var(--text-secondary)' }}>
                      {new Date(expense.spent_date).toLocaleDateString()}
                    </td>

                    {scope === 'all' && (
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ color: 'var(--text-white)', fontWeight: '600' }}>{expense.user.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{expense.user.team_name || 'No Team'}</div>
                      </td>
                    )}

                    <td style={{ padding: '16px 16px', fontWeight: '800', color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                      ${expense.amount.toFixed(2)}
                    </td>

                    <td style={{ padding: '16px 16px' }}>
                      <StatusBadge status={expense.status} size="sm" />
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(expense.id);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.total_pages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.6)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Showing Page <strong>{meta.current_page}</strong> of <strong>{meta.total_pages}</strong> ({meta.total_count} total items)
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= meta.total_pages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
