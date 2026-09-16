import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Receipt,
  Layers,
  Inbox,
  CreditCard,
  BarChart3,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'expenses' | 'review_queue' | 'reimbursements' | 'reports';
  onTabChange: (tab: 'expenses' | 'review_queue' | 'reimbursements' | 'reports') => void;
  reviewCount?: number;
  reimbursementCount?: number;
}

const DEMO_ACCOUNTS = [
  { name: 'Alice Chen', email: 'alice@expenseflow.com', role: 'Employee (Eng)', color: '#3b82f6' },
  { name: 'Bob Miller', email: 'bob@expenseflow.com', role: 'Employee (Eng)', color: '#3b82f6' },
  { name: 'Carol Davis', email: 'carol@expenseflow.com', role: 'Employee (Mkt)', color: '#3b82f6' },
  { name: 'Alex Lead', email: 'manager.eng@expenseflow.com', role: 'Manager (Eng)', color: '#10b981' },
  { name: 'Maria Lead', email: 'manager.mkt@expenseflow.com', role: 'Manager (Mkt)', color: '#10b981' },
  { name: 'Sarah Admin', email: 'admin@expenseflow.com', role: 'Admin (Finance)', color: '#a855f7' },
  { name: 'James Finance', email: 'admin2@expenseflow.com', role: 'Admin (Finance)', color: '#a855f7' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  reviewCount = 0,
  reimbursementCount = 0,
}) => {
  const { user, logout, login } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleSwitchUser = async (email: string) => {
    setShowDemoMenu(false);
    await login(email, 'password123');
  };

  return (
    <header
      style={{
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 400,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 20px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
            onClick={() => onTabChange('expenses')}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Receipt size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ExpenseFlow
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => onTabChange('expenses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: currentTab === 'expenses' ? '700' : '500',
                color: currentTab === 'expenses' ? 'var(--text-white)' : 'var(--text-secondary)',
                background: currentTab === 'expenses' ? 'var(--bg-elevated)' : 'transparent',
                border: currentTab === 'expenses' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              }}
            >
              <Layers size={16} />
              Expenses
            </button>

            {(user?.role === 'manager' || user?.role === 'admin') && (
              <button
                type="button"
                onClick={() => onTabChange('review_queue')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: currentTab === 'review_queue' ? '700' : '500',
                  color: currentTab === 'review_queue' ? 'var(--text-white)' : 'var(--text-secondary)',
                  background: currentTab === 'review_queue' ? 'var(--bg-elevated)' : 'transparent',
                  border: currentTab === 'review_queue' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  position: 'relative',
                }}
              >
                <Inbox size={16} />
                Review Queue
                {reviewCount > 0 && (
                  <span
                    style={{
                      background: 'var(--accent-amber)',
                      color: '#000000',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 6px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                    }}
                  >
                    {reviewCount}
                  </span>
                )}
              </button>
            )}

            {user?.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange('reimbursements')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: currentTab === 'reimbursements' ? '700' : '500',
                    color: currentTab === 'reimbursements' ? 'var(--text-white)' : 'var(--text-secondary)',
                    background: currentTab === 'reimbursements' ? 'var(--bg-elevated)' : 'transparent',
                    border: currentTab === 'reimbursements' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    position: 'relative',
                  }}
                >
                  <CreditCard size={16} />
                  Reimbursements
                  {reimbursementCount > 0 && (
                    <span
                      style={{
                        background: 'var(--primary)',
                        color: '#ffffff',
                        borderRadius: 'var(--radius-full)',
                        padding: '1px 6px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                      }}
                    >
                      {reimbursementCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('reports')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: currentTab === 'reports' ? '700' : '500',
                    color: currentTab === 'reports' ? 'var(--text-white)' : 'var(--text-secondary)',
                    background: currentTab === 'reports' ? 'var(--bg-elevated)' : 'transparent',
                    border: currentTab === 'reports' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  }}
                >
                  <BarChart3 size={16} />
                  Reports
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Demo User Switcher Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'var(--border-glow)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary)',
              }}
              title="Quickly switch between seeded demo roles"
            >
              <Sparkles size={14} />
              Switch Demo User
              <ChevronDown size={14} />
            </button>

            {showDemoMenu && (
              <div
                className="animate-slide-down"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  background: '#131b2e',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
                  zIndex: 600,
                  padding: '6px 0',
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Select Demo Persona
                </div>
                {DEMO_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => handleSwitchUser(acc.email)}
                    style={{
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: user?.email === acc.email ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        user?.email === acc.email ? 'rgba(99, 102, 241, 0.15)' : 'transparent')
                    }
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-white)' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: acc.color,
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {acc.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <NotificationDropdown />

          {/* User Profile / Logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '12px',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-white)' }}>
                {user?.name}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'capitalize',
                  color:
                    user?.role === 'admin'
                      ? 'var(--accent-purple)'
                      : user?.role === 'manager'
                      ? 'var(--accent-emerald)'
                      : 'var(--accent-cyan)',
                  fontWeight: '600',
                }}
              >
                {user?.role} {user?.team ? `• ${user.team.name}` : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px' }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
