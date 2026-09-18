import React, { useState, useEffect } from 'react';
import { Category, Expense } from '../types';
import { api } from '../api/client';
import { Sparkles, AlertCircle, Calendar, DollarSign, Tag, FileText, Send } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  expenseToEdit?: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message?: string) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  expenseToEdit,
  categories,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [spentDate, setSpentDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setDescription(expenseToEdit.description || '');
      setAmount(String(expenseToEdit.amount));
      setSpentDate(expenseToEdit.spent_date);
      setCategoryId(expenseToEdit.category.id);
    } else {
      setTitle('');
      setDescription('');
      setAmount('');
      const today = new Date().toISOString().split('T')[0];
      setSpentDate(today);
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
    setErrors({});
    setServerError('');
  }, [expenseToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));
  const parsedAmount = parseFloat(amount) || 0;
  const isAutoApprovable =
    selectedCategory &&
    selectedCategory.auto_approve_limit > 0 &&
    parsedAmount > 0 &&
    parsedAmount <= selectedCategory.auto_approve_limit;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Title is required.';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Amount must be greater than $0.00.';
    } else if (numAmount > 100000) {
      errs.amount = 'Amount cannot exceed $100,000.00.';
    }

    if (!spentDate) {
      errs.spentDate = 'Date spent is required.';
    } else if (spentDate > todayStr) {
      errs.spentDate = 'Date spent cannot be in the future.';
    } else if (spentDate < ninetyDaysAgo) {
      errs.spentDate = 'Date spent cannot be more than 90 days in the past.';
    }

    if (!categoryId) {
      errs.categoryId = 'Category is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (submitAfterSave = false) => {
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      let savedExpense: Expense;
      if (expenseToEdit) {
        const response = await api.updateExpense(expenseToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          spent_date: spentDate,
          category_id: Number(categoryId),
        });
        savedExpense = response.expense;
      } else {
        const response = await api.createExpense({
          title: title.trim(),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          spent_date: spentDate,
          category_id: Number(categoryId),
        });
        savedExpense = response.expense;
      }

      if (submitAfterSave) {
        await api.submitExpense(savedExpense.id);
        onSaved('Expense saved and submitted for review.');
      } else {
        onSaved(expenseToEdit ? 'Draft updated successfully!' : 'Draft created successfully!');
      }
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSave(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-down">
        <div className="modal-header">
          <h3 className="modal-title">
            {expenseToEdit ? 'Edit Draft Expense' : 'Create New Expense'}
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {serverError && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid var(--accent-rose)',
                  color: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} color="var(--accent-rose)" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                Expense Title <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Client Lunch with Stripe Team"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            {/* Category and Amount row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">
                  Category <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <select
                  className="select-field"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(Number(e.target.value));
                    if (errors.categoryId) setErrors({ ...errors, categoryId: '' });
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.auto_approve_limit > 0 ? `(Auto-approves ≤ $${c.auto_approve_limit.toFixed(0)})` : '(Manual review)'}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Amount ($) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100000"
                    className="input-field"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) setErrors({ ...errors, amount: '' });
                    }}
                  />
                </div>
                {errors.amount && <span className="form-error">{errors.amount}</span>}
              </div>
            </div>

            {/* Auto-approval Hint Pill */}
            {isAutoApprovable ? (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--accent-emerald)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={14} />
                <span>
                  <strong>Auto-Approval Eligible:</strong> This expense is within the ${selectedCategory.auto_approve_limit.toFixed(2)} category limit and will be instantly approved upon submission.
                </span>
              </div>
            ) : selectedCategory && parsedAmount > selectedCategory.auto_approve_limit ? (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: 'var(--accent-amber)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={14} />
                <span>
                  Requires manager review (Amount exceeds category auto-approval limit of ${selectedCategory.auto_approve_limit.toFixed(2)}).
                </span>
              </div>
            ) : null}

            {/* Date Spent */}
            <div className="form-group">
              <label className="form-label">
                Date Spent <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="date"
                className="input-field"
                max={todayStr}
                min={ninetyDaysAgo}
                value={spentDate}
                onChange={(e) => {
                  setSpentDate(e.target.value);
                  if (errors.spentDate) setErrors({ ...errors, spentDate: '' });
                }}
              />
              <span className="form-hint">Must be within the past 90 days and not in the future.</span>
              {errors.spentDate && <span className="form-error">{errors.spentDate}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="textarea-field"
                rows={3}
                placeholder="Add business justification or context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-secondary" disabled={loading}>
                {loading ? 'Saving...' : expenseToEdit ? 'Update Draft' : 'Save as Draft'}
              </button>
              <button type="button" className="btn btn-primary" disabled={loading} onClick={() => void handleSave(true)}>
                <Send size={16} /> {loading ? 'Submitting...' : 'Save & Submit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
