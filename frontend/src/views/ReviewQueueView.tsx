import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  User as UserIcon,
  Tag,
  DollarSign,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface ReviewQueueViewProps {
  onOpenDetail: (id: number) => void;
  onOpenApprove: (expense: Expense) => void;
  onOpenReject: (expense: Expense) => void;
  refreshKey?: number;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  onOpenDetail,
  onOpenApprove,
  onOpenReject,
  refreshKey = 0,
}) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getReviewQueue();
      setExpenses(res.expenses);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [refreshKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white)' }}>
              Review & Approvals Queue
            </h1>
            <span
              style={{
                background: 'var(--accent-amber)',
                color: '#000000',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {expenses.length} Pending
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {user?.role === 'admin'
              ? 'Reviewing manager and leadership expenses pending executive sign-off'
              : `Reviewing expenses submitted by members of your managed team (${user?.managed_team?.name || 'Your Team'})`}
          </p>
        </div>

        <button type="button" onClick={fetchQueue} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Review Queue List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
          Loading pending reviews...
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent-emerald)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-white)' }}>
            All Caught Up!
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 0' }}>
            There are currently no expense submissions awaiting your review or decision.
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
                borderLeft: '4px solid var(--accent-amber)',
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
                    {expense.user.name} ({expense.user.role})
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={14} color="var(--accent-cyan)" />
                    {expense.category.name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} color="var(--accent-amber)" />
                    Spent on {new Date(expense.spent_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Middle Amount */}
              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Claim Amount
                </span>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: 'var(--text-white)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ${expense.amount.toFixed(2)}
                </div>
              </div>

              {/* Right Action Buttons */}
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
                  onClick={() => onOpenReject(expense)}
                  className="btn btn-danger btn-sm"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => onOpenApprove(expense)}
                  className="btn btn-success btn-sm"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
