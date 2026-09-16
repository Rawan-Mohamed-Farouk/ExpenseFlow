import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { api } from '../api/client';
import { StatusBadge } from './StatusBadge';
import {
  Send,
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  User as UserIcon,
  Tag,
  Calendar,
  DollarSign,
  FileText,
  ShieldAlert,
  Bot,
} from 'lucide-react';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  expenseId: number | null;
  onClose: () => void;
  onActionComplete: () => void;
  onEdit: (expense: Expense) => void;
  onOpenApprove: (expense: Expense) => void;
  onOpenReject: (expense: Expense) => void;
  onOpenReimburse: (expense: Expense) => void;
  onOpenDelete: (expense: Expense) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  expenseId,
  onClose,
  onActionComplete,
  onEdit,
  onOpenApprove,
  onOpenReject,
  onOpenReimburse,
  onOpenDelete,
}) => {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchExpense = async () => {
    if (!expenseId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getExpense(expenseId);
      setExpense(res.expense);
    } catch (err: any) {
      setError(err.message || 'Failed to load expense details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpense();
    } else {
      setExpense(null);
    }
  }, [isOpen, expenseId]);

  if (!isOpen || !expenseId) return null;

  const handleSubmitExpense = async () => {
    if (!expense) return;
    setActionLoading(true);
    try {
      await api.submitExpense(expense.id);
      await fetchExpense();
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to submit expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenExpense = async () => {
    if (!expense) return;
    setActionLoading(true);
    try {
      await api.reopenExpense(expense.id);
      await fetchExpense();
      onActionComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen expense');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-down" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="modal-title">Expense #{expenseId}</h3>
            {expense && <StatusBadge status={expense.status} />}
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading expense details...
            </div>
          ) : error ? (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {error}
            </div>
          ) : expense ? (
            <>
              {/* Top Overview Banner */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-white)' }}>
                    {expense.title}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginTop: '8px',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserIcon size={14} color="var(--primary)" />
                      {expense.user.name} ({expense.user.team_name || 'No Team'})
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

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Amount
                  </div>
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
              </div>

              {/* Description */}
              {expense.description && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    DESCRIPTION & JUSTIFICATION
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {expense.description}
                  </p>
                </div>
              )}

              {/* Reimbursement Payment Reference Banner (if reimbursed) */}
              {expense.payment_reference && (
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid var(--primary-glow)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Banknote size={18} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payment Reference</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                        {expense.payment_reference}
                      </div>
                    </div>
                  </div>
                  {expense.reimbursed_at && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Reimbursed on {new Date(expense.reimbursed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {/* Audit History Timeline */}
              <div>
                <h4
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}
                >
                  Activity & Audit History
                </h4>

                <div
                  style={{
                    position: 'relative',
                    paddingLeft: '24px',
                    borderLeft: '2px solid var(--border-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    marginLeft: '8px',
                  }}
                >
                  {expense.histories && expense.histories.length > 0 ? (
                    expense.histories.map((hist) => (
                      <div key={hist.id} style={{ position: 'relative' }}>
                        {/* Timeline dot */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-31px',
                            top: '4px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: hist.actor_type === 'system' ? 'var(--accent-cyan)' : 'var(--primary)',
                            border: '2px solid var(--bg-surface)',
                            boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
                          }}
                        />

                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 14px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {hist.actor_type === 'system' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    color: 'var(--accent-cyan)',
                                    background: 'rgba(6, 182, 212, 0.15)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                  }}
                                >
                                  <Bot size={12} /> System Auto-Approval
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-white)' }}>
                                  {hist.actor_name}
                                </span>
                              )}
                              <StatusBadge status={hist.new_status} size="sm" />
                            </div>

                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(hist.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {hist.comment && (
                            <p
                              style={{
                                fontSize: '0.8125rem',
                                color: hist.new_status === 'rejected' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                                marginTop: '4px',
                                fontStyle: 'italic',
                              }}
                            >
                              "{hist.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No history recorded.</div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Action Toolbar Footer */}
        {expense && (
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {expense.allowed_actions.includes('delete') && (
                <button
                  type="button"
                  onClick={() => onOpenDelete(expense)}
                  className="btn btn-outline"
                  style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                >
                  <Trash2 size={16} /> Delete Draft
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {expense.allowed_actions.includes('edit') && (
                <button type="button" onClick={() => onEdit(expense)} className="btn btn-secondary">
                  <Edit size={16} /> Edit Draft
                </button>
              )}

              {expense.allowed_actions.includes('submit') && (
                <button
                  type="button"
                  onClick={handleSubmitExpense}
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  <Send size={16} /> {actionLoading ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}

              {expense.allowed_actions.includes('reopen') && (
                <button
                  type="button"
                  onClick={handleReopenExpense}
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  <RotateCcw size={16} /> {actionLoading ? 'Reopening...' : 'Reopen to Draft'}
                </button>
              )}

              {expense.allowed_actions.includes('reject') && (
                <button
                  type="button"
                  onClick={() => onOpenReject(expense)}
                  className="btn btn-danger"
                >
                  <XCircle size={16} /> Reject
                </button>
              )}

              {expense.allowed_actions.includes('approve') && (
                <button
                  type="button"
                  onClick={() => onOpenApprove(expense)}
                  className="btn btn-success"
                >
                  <CheckCircle2 size={16} /> Approve
                </button>
              )}

              {expense.allowed_actions.includes('reimburse') && (
                <button
                  type="button"
                  onClick={() => onOpenReimburse(expense)}
                  className="btn btn-primary"
                >
                  <Banknote size={16} /> Mark Reimbursed
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
