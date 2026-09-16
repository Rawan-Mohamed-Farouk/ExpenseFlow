import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Receipt, AlertCircle, Sparkles, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

const DEMO_PERSONAS = [
  {
    name: 'Alice Chen',
    role: 'Employee (Eng)',
    email: 'alice@expenseflow.com',
    desc: 'Creates & submits expenses. Has auto-approved and pending expenses.',
    badgeColor: '#3b82f6',
  },
  {
    name: 'Alex Lead',
    role: 'Manager (Eng)',
    email: 'manager.eng@expenseflow.com',
    desc: 'Reviews Engineering team expenses (Alice & Bob). Submits own expenses.',
    badgeColor: '#10b981',
  },
  {
    name: 'Sarah Admin',
    role: 'Admin (Finance)',
    email: 'admin@expenseflow.com',
    desc: 'Reviews manager expenses, marks reimbursements, views monthly reports.',
    badgeColor: '#a855f7',
  },
  {
    name: 'James Finance',
    role: 'Admin (Finance)',
    email: 'admin2@expenseflow.com',
    desc: 'Second admin for peer reviews of Sarah Admin expenses & reports.',
    badgeColor: '#a855f7',
  },
  {
    name: 'Dave Inactive',
    role: 'Deactivated User',
    email: 'dave.inactive@expenseflow.com',
    desc: 'Test deactivated account rejection on login.',
    badgeColor: '#64748b',
  },
];

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('alice@expenseflow.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (pEmail: string) => {
    setEmail(pEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0b0f19 70%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: '32px',
          background: 'rgba(17, 24, 39, 0.85)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Left Form Panel */}
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Receipt size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-white)' }}>ExpenseFlow</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team Expense Platform</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-white)', marginBottom: '6px' }}>
            Sign in to your account
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Enter your credentials or click a demo persona on the right.
          </p>

          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid var(--accent-rose)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} color="var(--accent-rose)" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: '8px', width: '100%' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Right Demo Personas Panel */}
        <div
          style={{
            background: 'rgba(11, 15, 25, 0.85)',
            borderLeft: '1px solid var(--border-subtle)',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-white)' }}>
              Quick Demo Personas
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Click any demo profile to pre-fill login credentials (password: <code>password123</code>)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {DEMO_PERSONAS.map((p) => {
              const isSelected = email === p.email;
              return (
                <div
                  key={p.email}
                  onClick={() => handleSelectPersona(p.email)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--text-white)' }}>
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: p.badgeColor,
                        background: 'rgba(255,255,255,0.06)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {p.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {p.email}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {p.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
