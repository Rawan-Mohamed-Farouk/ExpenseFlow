import React from 'react';
import { ExpenseStatus } from '../types';
import { Clock, Send, CheckCircle2, XCircle, Banknote } from 'lucide-react';

interface StatusBadgeProps {
  status: ExpenseStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getIcon = () => {
    switch (status) {
      case 'draft':
        return <Clock size={size === 'sm' ? 12 : 14} />;
      case 'submitted':
        return <Send size={size === 'sm' ? 12 : 14} />;
      case 'approved':
        return <CheckCircle2 size={size === 'sm' ? 12 : 14} />;
      case 'rejected':
        return <XCircle size={size === 'sm' ? 12 : 14} />;
      case 'reimbursed':
        return <Banknote size={size === 'sm' ? 12 : 14} />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'reimbursed':
        return 'Reimbursed';
      default:
        return status;
    }
  };

  return (
    <span className={`status-badge ${status}`} style={size === 'sm' ? { fontSize: '0.7rem', padding: '2px 8px' } : {}}>
      {getIcon()}
      {getLabel()}
    </span>
  );
};
