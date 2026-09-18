import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  CreditCard,
  Banknote,
  Eye,
  Calendar,
  User as UserIcon,
  Tag,
  DollarSign,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface ReimbursementsViewProps {
  onOpenDetail: (id: number) => void;
  onOpenReimburse: (expense: Expense) => void;
  refreshKey?: number;
}

export const ReimbursementsView: React.FC<ReimbursementsViewProps> = ({
  onOpenDetail,
  onOpenReimburse,
  refreshKey = 0,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const res = await api.getReimbursements();
      setExpenses(res.expenses);
    } catch (err) {
      console.error('Failed to load reimbursements queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, [refreshKey]);

  const totalPayout = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white)' }}>
              Finance Reimbursement Payouts
            </h1>
            <span
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {expenses.length} Approved Ready
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Process bank transfers, corporate ACH or wire payments for approved employee expenses
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid var(--border-glow)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--text-white)',
            }}
          >
            Total Payout Pending: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>${totalPayout.toFixed(2)}</strong>
          </div>

          <button type="button" onClick={fetchReimbursements} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Reimbursements List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
          Loading payout queue...
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--primary)',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-white)' }}>
            No Pending Payouts
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 0' }}>
            All approved expenses have been fully disbursed and marked as reimbursed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="glass-card"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: '4px solid var(--accent-emerald)',
              }}
            >
              {/* Left Details */}
              <div style={{ flex: '1 1 340px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-white)' }}>
                    {expense.title}
                  </h3>
                  <StatusBadge status={expense.status} size="sm" />
                </div>

                {expense.description && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {expense.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginTop: '12px',
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-white)', fontWeight: '600' }}>
                    <UserIcon size={14} color="var(--primary)" />
                    Payee: {expense.user.name} ({expense.user.email})
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={14} color="var(--accent-cyan)" />
                    {expense.category.name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} color="var(--accent-amber)" />
                    Spent {new Date(expense.spent_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Middle Amount */}
              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Approved Payout
                </span>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: 'var(--accent-emerald)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ${expense.amount.toFixed(2)}
                </div>
              </div>

              {/* Right Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => onOpenDetail(expense.id)}
                  className="btn btn-secondary btn-sm"
                >
                  <Eye size={14} /> Details
                </button>
                <button
                  type="button"
                  onClick={() => onOpenReimburse(expense)}
                  className="btn btn-primary btn-sm"
                >
                  <Banknote size={16} /> Mark Reimbursed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
