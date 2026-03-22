import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentHistory } from '../services/paymentService';

const STATUS_STYLES = {
  succeeded: { background: '#d1fae5', color: '#065f46' },
  paid: { background: '#d1fae5', color: '#065f46' },
  pending: { background: '#fef3c7', color: '#92400e' },
  failed: { background: '#fee2e2', color: '#991b1b' },
  refunded: { background: '#ede9fe', color: '#5b21b6' },
};

const page = {
  maxWidth: 900,
  margin: '32px auto',
  padding: '0 20px',
  fontFamily: '"Inter", sans-serif',
};

const heading = { fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 };
const subText = { fontSize: 13, color: '#6b7280', marginBottom: 24 };

const summaryRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginBottom: 24,
};

const summaryCard = {
  flex: '1 1 160px',
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '14px 18px',
};

const summaryValue = { fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 2 };
const summaryLabel = { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 };

const filterBar = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '14px 16px',
  marginBottom: 20,
  alignItems: 'flex-end',
};

const labelWrap = { display: 'flex', flexDirection: 'column', gap: 3 };
const labelTxt = { fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' };

const inputStyle = {
  padding: '8px 10px',
  border: '1.5px solid #d1d5db',
  borderRadius: 7,
  fontSize: 13,
  outline: 'none',
};

const applyBtn = {
  padding: '8px 16px',
  background: '#635bff',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  alignSelf: 'flex-end',
};

const csvBtn = {
  padding: '8px 14px',
  background: '#fff',
  color: '#374151',
  border: '1.5px solid #d1d5db',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  alignSelf: 'flex-end',
};

const tableWrapper = { overflowX: 'auto' };
const table = { width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 620 };

const th = {
  textAlign: 'left',
  padding: '10px 14px',
  background: '#f3f4f6',
  color: '#374151',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '2px solid #e5e7eb',
};

const td = {
  padding: '12px 14px',
  borderBottom: '1px solid #f3f4f6',
  color: '#374151',
};

const statusBadge = (status) => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'capitalize',
  ...(STATUS_STYLES[status?.toLowerCase()] || { background: '#f3f4f6', color: '#374151' }),
});

const paginationRow = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
  marginTop: 20,
};

const pageBtn = (active) => ({
  padding: '6px 12px',
  border: `1.5px solid ${active ? '#635bff' : '#d1d5db'}`,
  background: active ? '#635bff' : '#fff',
  color: active ? '#fff' : '#374151',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});

const chartPlaceholder = {
  background: '#f3f4f6',
  border: '2px dashed #d1d5db',
  borderRadius: 10,
  padding: '32px',
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 14,
  marginBottom: 24,
};

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: '12px 16px',
  color: '#b91c1c',
  fontSize: 14,
  marginBottom: 16,
};

const emptyState = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#9ca3af',
  fontSize: 15,
};

const PAGE_SIZE = 15;
const DEFAULT_FILTERS = { status: '', dateFrom: '', dateTo: '' };

/** Convert amount in cents to a formatted dollar string */
const formatCurrency = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [applied, setApplied] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalSpentIsPageOnly, setTotalSpentIsPageOnly] = useState(false);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    setError('');
    getPaymentHistory({
      page: currentPage,
      limit: PAGE_SIZE,
      status: applied.status || undefined,
      dateFrom: applied.dateFrom || undefined,
      dateTo: applied.dateTo || undefined,
    })
      .then((res) => {
        const data = res.data;
        const list = data.payments || data.transactions || data.history || data || [];
        setTransactions(list);
        const tp = data.totalPages || Math.ceil((data.total || list.length) / PAGE_SIZE) || 1;
        setTotalPages(tp);
        // Amounts from the API are in cents (Stripe convention); convert to dollars for display
        if (data.totalSpent != null) {
          setTotalSpent(data.totalSpent / 100);
          setTotalSpentIsPageOnly(false);
        } else {
          setTotalSpent(list.reduce((s, t) => s + Number(t.amount || 0) / 100, 0));
          setTotalSpentIsPageOnly(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load payment history.');
        setLoading(false);
      });
  }, [currentPage, applied]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleApply = () => {
    setApplied({ ...filters });
    setCurrentPage(1);
  };

  const handleCsvDownload = () => {
    alert('CSV export coming soon.');
  };

  return (
    <div style={page}>
      <h1 style={heading}>Payment History</h1>
      <p style={subText}>A complete record of your transactions.</p>

      {/* Summary cards */}
      <div style={summaryRow}>
        <div style={summaryCard}>
          <div style={summaryValue}>${totalSpent.toFixed(2)}</div>
          <div style={summaryLabel}>
            Total Spent{totalSpentIsPageOnly ? ' (this page)' : ''}
          </div>
        </div>
        <div style={summaryCard}>
          <div style={summaryValue}>{transactions.length}</div>
          <div style={summaryLabel}>Transactions</div>
        </div>
        <div style={summaryCard}>
          <div style={summaryValue}>
            {transactions.filter((t) => (t.status || '').toLowerCase() === 'succeeded' || (t.status || '').toLowerCase() === 'paid').length}
          </div>
          <div style={summaryLabel}>Successful</div>
        </div>
        <div style={summaryCard}>
          <div style={summaryValue}>
            {transactions.filter((t) => (t.status || '').toLowerCase() === 'refunded').length}
          </div>
          <div style={summaryLabel}>Refunded</div>
        </div>
      </div>

      {/* Chart placeholder */}
      <div style={chartPlaceholder}>
        📈 Revenue chart coming soon
      </div>

      {/* Filters */}
      <div style={filterBar}>
        <div style={labelWrap}>
          <span style={labelTxt}>Status</span>
          <select
            style={inputStyle}
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">All</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div style={labelWrap}>
          <span style={labelTxt}>From</span>
          <input
            style={inputStyle}
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
          />
        </div>
        <div style={labelWrap}>
          <span style={labelTxt}>To</span>
          <input
            style={inputStyle}
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
          />
        </div>
        <button style={applyBtn} onClick={handleApply}>
          Apply
        </button>
        <button style={csvBtn} onClick={handleCsvDownload}>
          ↓ CSV
        </button>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {/* Table */}
      {loading ? (
        <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : transactions.length === 0 ? (
        <div style={emptyState}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
          <p style={{ fontWeight: 600, color: '#6b7280' }}>No transactions found</p>
        </div>
      ) : (
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Service</th>
                <th style={th}>Amount</th>
                <th style={th}>Payment Method</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, idx) => {
                const txnId = txn._id || txn.id || idx;
                const card = txn.paymentMethod || txn.card;
                return (
                  <tr key={txnId}>
                    <td style={td}>
                      {txn.createdAt || txn.date
                        ? new Date(txn.createdAt || txn.date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td style={td}>{txn.serviceName || txn.service || '—'}</td>
                    <td style={{ ...td, fontWeight: 600 }}>
                      {/* Amounts from API are in cents */}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td style={td}>
                      {card
                        ? typeof card === 'string'
                          ? card
                          : `${card.brand || ''} •••• ${card.last4 || ''}`
                        : '—'}
                    </td>
                    <td style={td}>
                      <span style={statusBadge(txn.status)}>{txn.status || '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationRow}>
          <button
            style={pageBtn(false)}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} style={pageBtn(n === currentPage)} onClick={() => setCurrentPage(n)}>
              {n}
            </button>
          ))}
          <button
            style={pageBtn(false)}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;