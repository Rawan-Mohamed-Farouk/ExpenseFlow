import React, { useState } from 'react';
import { CheckCircle2, XCircle, Banknote, Trash2, AlertTriangle } from 'lucide-react';

interface ApproveModalProps {
  isOpen: boolean;
  expenseTitle: string;
  expenseAmount: number;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

export const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  expenseTitle,
  expenseAmount,
  onClose,
  onConfirm,
}) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(comment);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-down">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={20} />
            <h3 className="modal-title">Approve Expense</h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Are you sure you want to approve{' '}
              <strong style={{ color: 'var(--text-white)' }}>{expenseTitle}</strong> for{' '}
              <strong style={{ color: 'var(--accent-emerald)' }}>${expenseAmount.toFixed(2)}</strong>?
            </p>
            <div className="form-group">
              <label className="form-label">Reviewer Notes (Optional)</label>
              <textarea
                className="textarea-field"
                rows={3}
                placeholder="e.g., Verified with team budget, looks good."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RejectModalProps {
  isOpen: boolean;
  expenseTitle: string;
  expenseAmount: number;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  expenseTitle,
  expenseAmount,
  onClose,
  onConfirm,
}) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('A rejection reason is required so the employee knows what to adjust.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onConfirm(comment);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-down">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
            <XCircle size={20} />
            <h3 className="modal-title">Reject Expense</h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Please provide feedback explaining why{' '}
              <strong style={{ color: 'var(--text-white)' }}>{expenseTitle}</strong> (${expenseAmount.toFixed(2)}) is being rejected.
            </p>
            <div className="form-group">
              <label className="form-label">
                Rejection Reason <span style={{ color: 'var(--accent-rose)' }}>* Required</span>
              </label>
              <textarea
                className="textarea-field"
                rows={4}
                required
                placeholder="e.g., Missing itemized tax receipt or exceeds daily meal per-diem."
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (error) setError('');
                }}
              />
              {error && <span className="form-error">{error}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReimburseModalProps {
  isOpen: boolean;
  expenseTitle: string;
  expenseAmount: number;
  onClose: () => void;
  onConfirm: (paymentRef: string) => Promise<void>;
}

export const ReimburseModal: React.FC<ReimburseModalProps> = ({
  isOpen,
  expenseTitle,
  expenseAmount,
  onClose,
  onConfirm,
}) => {
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef.trim()) {
      setError('A payment reference number / transaction ID is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onConfirm(paymentRef);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-down">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <Banknote size={20} />
            <h3 className="modal-title">Process Reimbursement</h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Reimbursement Payout</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-white)' }}>
                ${expenseAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                For: {expenseTitle}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Payment Reference <span style={{ color: 'var(--accent-rose)' }}>* Required</span>
              </label>
              <input
                type="text"
                className="input-field"
                required
                placeholder="e.g., WIRE-2026-9821 or ACH-77412"
                value={paymentRef}
                onChange={(e) => {
                  setPaymentRef(e.target.value);
                  if (error) setError('');
                }}
              />
              <span className="form-hint">Enter the bank transfer reference or check number.</span>
              {error && <span className="form-error">{error}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Mark Reimbursed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  isOpen: boolean;
  expenseTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  expenseTitle,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-down" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
            <Trash2 size={20} />
            <h3 className="modal-title">Delete Draft</h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to permanently delete the draft expense{' '}
            <strong style={{ color: 'var(--text-white)' }}>"{expenseTitle}"</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-danger" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};
