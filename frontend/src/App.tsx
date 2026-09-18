import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';
import { ExpensesView } from './views/ExpensesView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { ReimbursementsView } from './views/ReimbursementsView';
import { ReportsView } from './views/ReportsView';
import { ExpenseModal } from './components/ExpenseModal';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import {
  ApproveModal,
  RejectModal,
  ReimburseModal,
  ConfirmDeleteModal,
} from './components/ActionModals';
import { Category, Expense } from './types';
import { api } from './api/client';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'expenses' | 'review_queue' | 'reimbursements' | 'reports'>('expenses');
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reimbursementCount, setReimbursementCount] = useState(0);
  const [expensesRefreshKey, setExpensesRefreshKey] = useState(0);
  const [reviewQueueRefreshKey, setReviewQueueRefreshKey] = useState(0);
  const [reimbursementsRefreshKey, setReimbursementsRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [detailExpenseId, setDetailExpenseId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [approveExpense, setApproveExpense] = useState<Expense | null>(null);
  const [rejectExpense, setRejectExpense] = useState<Expense | null>(null);
  const [reimburseExpense, setReimburseExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      const catRes = await api.getCategories();
      setCategories(catRes.categories);

      if (user.role === 'manager' || user.role === 'admin') {
        const revRes = await api.getReviewQueue();
        setReviewCount(revRes.count);
      }

      if (user.role === 'admin') {
        const reimbRes = await api.getReimbursements();
        setReimbursementCount(reimbRes.count);
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
        }}
      >
        Connecting to ExpenseFlow...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleOpenCreate = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setIsDetailModalOpen(false);
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenDetail = (id: number) => {
    setDetailExpenseId(id);
    setIsDetailModalOpen(true);
  };

  const handleConfirmApprove = async (comment: string) => {
    if (!approveExpense) return;
    try {
      await api.approveExpense(approveExpense.id, comment);
      showToast(`Expense "${approveExpense.title}" approved successfully!`);
      setReviewQueueRefreshKey((key) => key + 1);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve expense', 'error');
    }
  };

  const handleConfirmReject = async (comment: string) => {
    if (!rejectExpense) return;
    try {
      await api.rejectExpense(rejectExpense.id, comment);
      showToast(`Expense "${rejectExpense.title}" was rejected.`);
      setReviewQueueRefreshKey((key) => key + 1);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject expense', 'error');
    }
  };

  const handleConfirmReimburse = async (paymentRef: string) => {
    if (!reimburseExpense) return;
    try {
      await api.reimburseExpense(reimburseExpense.id, paymentRef);
      showToast(`Expense "${reimburseExpense.title}" marked as reimbursed.`);
      setReimbursementsRefreshKey((key) => key + 1);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reimburse expense', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteExpense) return;
    try {
      await api.deleteExpense(deleteExpense.id);
      showToast(`Draft expense "${deleteExpense.title}" deleted.`);
      setIsDetailModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className="animate-slide-down"
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            zIndex: 1100,
            background: toast.type === 'success' ? '#064e3b' : '#881337',
            border: `1px solid ${toast.type === 'success' ? '#059669' : '#e11d48'}`,
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#34d399" />
          ) : (
            <AlertCircle size={18} color="#fb7185" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        reviewCount={reviewCount}
        reimbursementCount={reimbursementCount}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 20px', flex: 1 }}>
        {currentTab === 'expenses' && (
          <ExpensesView
            onOpenCreate={handleOpenCreate}
            onOpenDetail={handleOpenDetail}
            categories={categories}
            refreshKey={expensesRefreshKey}
          />
        )}

        {currentTab === 'review_queue' && (
          <ReviewQueueView
            onOpenDetail={handleOpenDetail}
            onOpenApprove={(exp) => setApproveExpense(exp)}
            onOpenReject={(exp) => setRejectExpense(exp)}
            refreshKey={reviewQueueRefreshKey}
          />
        )}

        {currentTab === 'reimbursements' && (
          <ReimbursementsView
            onOpenDetail={handleOpenDetail}
            onOpenReimburse={(exp) => setReimburseExpense(exp)}
            refreshKey={reimbursementsRefreshKey}
          />
        )}

        {currentTab === 'reports' && <ReportsView />}
      </main>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        expenseToEdit={expenseToEdit}
        categories={categories}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaved={(message) => {
          showToast(message || (expenseToEdit ? 'Draft updated successfully!' : 'Draft created successfully!'));
          setExpensesRefreshKey((key) => key + 1);
          fetchInitialData();
        }}
      />

      <ExpenseDetailModal
        isOpen={isDetailModalOpen}
        expenseId={detailExpenseId}
        onClose={() => setIsDetailModalOpen(false)}
        onActionComplete={() => {
          showToast('Expense action processed successfully!');
          setReviewQueueRefreshKey((key) => key + 1);
          setReimbursementsRefreshKey((key) => key + 1);
          fetchInitialData();
        }}
        onEdit={handleOpenEdit}
        onOpenApprove={(exp) => {
          setIsDetailModalOpen(false);
          setApproveExpense(exp);
        }}
        onOpenReject={(exp) => {
          setIsDetailModalOpen(false);
          setRejectExpense(exp);
        }}
        onOpenReimburse={(exp) => {
          setIsDetailModalOpen(false);
          setReimburseExpense(exp);
        }}
        onOpenDelete={(exp) => {
          setIsDetailModalOpen(false);
          setDeleteExpense(exp);
        }}
      />

      {approveExpense && (
        <ApproveModal
          isOpen={!!approveExpense}
          expenseTitle={approveExpense.title}
          expenseAmount={approveExpense.amount}
          onClose={() => setApproveExpense(null)}
          onConfirm={handleConfirmApprove}
        />
      )}

      {rejectExpense && (
        <RejectModal
          isOpen={!!rejectExpense}
          expenseTitle={rejectExpense.title}
          expenseAmount={rejectExpense.amount}
          onClose={() => setRejectExpense(null)}
          onConfirm={handleConfirmReject}
        />
      )}

      {reimburseExpense && (
        <ReimburseModal
          isOpen={!!reimburseExpense}
          expenseTitle={reimburseExpense.title}
          expenseAmount={reimburseExpense.amount}
          onClose={() => setReimburseExpense(null)}
          onConfirm={handleConfirmReimburse}
        />
      )}

      {deleteExpense && (
        <ConfirmDeleteModal
          isOpen={!!deleteExpense}
          expenseTitle={deleteExpense.title}
          onClose={() => setDeleteExpense(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
