import React, { useState, useEffect } from 'react';
import { ReportSummary, ReportBreakdownItem } from '../types';
import { api } from '../api/client';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  FileCheck,
  CheckCircle2,
  Banknote,
  RefreshCw,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [breakdown, setBreakdown] = useState<ReportBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({ start_date: startDate, end_date: endDate });
      setSummary(res.summary);
      setBreakdown(res.breakdown);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await api.downloadReportsCsv({ start_date: startDate, end_date: endDate });
    } catch (err) {
      console.error('Failed to download CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePreset = (preset: '30d' | '90d' | 'ytd') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setEndDate(todayStr);

    if (preset === '30d') {
      const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === '90d') {
      const d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'ytd') {
      const d = new Date(today.getFullYear(), 0, 1);
      setStartDate(d.toISOString().split('T')[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & CSV Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white)' }}>
              Expense Intelligence & Monthly Reports
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Financial aggregate analysis for approved and reimbursed company expenses
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn btn-primary"
            disabled={exporting || loading}
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>

      {/* Date Filter & Presets Card */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-white)' }}>
            Date Range:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Presets:
          </span>
          <button type="button" onClick={() => handlePreset('30d')} className="btn btn-secondary btn-sm">
            Last 30 Days
          </button>
          <button type="button" onClick={() => handlePreset('90d')} className="btn btn-secondary btn-sm">
            Last 90 Days
          </button>
          <button type="button" onClick={() => handlePreset('ytd')} className="btn btn-secondary btn-sm">
            Year to Date
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Total Approved (Pending Payout)
              </span>
              <CheckCircle2 size={18} color="var(--accent-emerald)" />
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                color: 'var(--text-white)',
                marginTop: '10px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ${summary.total_approved_amount.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {summary.total_approved_count} approved claims awaiting reimbursement
            </span>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Total Reimbursed (Disbursed)
              </span>
              <Banknote size={18} color="var(--primary)" />
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                color: 'var(--primary)',
                marginTop: '10px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ${summary.total_reimbursed_amount.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {summary.total_reimbursed_count} claims successfully paid out
            </span>
          </div>

          <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Grand Total Spending
              </span>
              <DollarSign size={18} color="var(--accent-cyan)" />
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                color: 'var(--text-white)',
                marginTop: '10px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ${summary.grand_total_amount.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {summary.grand_total_count} total corporate expense transactions
            </span>
          </div>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-white)' }}>
              Monthly Category Spending Breakdown
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {breakdown.length} reporting row{breakdown.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '14px 20px' }}>Month</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Approved Claims</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Approved ($)</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Reimbursed Claims</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Reimbursed ($)</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Total Month ($)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Generating financial reports...
                  </td>
                </tr>
              ) : breakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No approved or reimbursed expenses recorded in this date range.
                  </td>
                </tr>
              ) : (
                breakdown.map((row, idx) => (
                  <tr
                    key={`${row.month}-${row.category_id}`}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                      {row.month}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {row.category_name}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {row.approved_count}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      ${row.approved_amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {row.reimbursed_count}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                      ${row.reimbursed_amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                      ${row.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {summary && breakdown.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    borderTop: '2px solid var(--border-subtle)',
                    fontWeight: '800',
                    color: 'var(--text-white)',
                  }}
                >
                  <td colSpan={2} style={{ padding: '16px 20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Summary Total
                  </td>
                  <td style={{ padding: '16px 16px', textAlign: 'right' }}>{summary.total_approved_count}</td>
                  <td style={{ padding: '16px 16px', textAlign: 'right', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                    ${summary.total_approved_amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 16px', textAlign: 'right' }}>{summary.total_reimbursed_count}</td>
                  <td style={{ padding: '16px 16px', textAlign: 'right', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    ${summary.total_reimbursed_amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-white)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
                    ${summary.grand_total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
