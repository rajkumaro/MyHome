import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceList from '../components/Payment/InvoiceList';
import { getPaymentHistory, downloadInvoice } from '../services/paymentService';

const page = {
  maxWidth: 900,
  margin: '32px auto',
  padding: '0 20px',
  fontFamily: '"Inter", sans-serif',
};

const heading = { fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 };
const subText = { fontSize: 13, color: '#6b7280', marginBottom: 24 };

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

const inputStyle = {
  padding: '8px 10px',
  border: '1.5px solid #d1d5db',
  borderRadius: 7,
  fontSize: 13,
  outline: 'none',
};

const labelWrap = { display: 'flex', flexDirection: 'column', gap: 3 };
const labelTxt = { fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' };

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

const resetBtn = {
  padding: '8px 12px',
  background: '#fff',
  color: '#374151',
  border: '1.5px solid #d1d5db',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  alignSelf: 'flex-end',
};

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

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: '12px 16px',
  color: '#b91c1c',
  fontSize: 14,
  marginBottom: 16,
};

const DEFAULT_FILTERS = { status: '', dateFrom: '', dateTo: '', search: '' };
const PAGE_SIZE = 10;

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [applied, setApplied] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = useCallback(() => {
    setLoading(true);
    setError('');
    getPaymentHistory({
      page,
      limit: PAGE_SIZE,
      status: applied.status || undefined,
      dateFrom: applied.dateFrom || undefined,
      dateTo: applied.dateTo || undefined,
    })
      .then((res) => {
        const data = res.data;
        const list = data.payments || data.invoices || data.history || data || [];
        setInvoices(list);
        const tp = data.totalPages || Math.ceil((data.total || list.length) / PAGE_SIZE) || 1;
        setTotalPages(tp);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load invoices.');
        setLoading(false);
      });
  }, [page, applied]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleApply = () => {
    setApplied({ ...filters });
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleDownload = async (bookingId) => {
    try {
      await downloadInvoice(bookingId);
    } catch {
      alert('Download failed. Please try again.');
    }
  };

  // Client-side search filter by invoice number / service name
  const displayed = applied.search
    ? invoices.filter((inv) => {
        const q = applied.search.toLowerCase();
        return (
          String(inv.invoiceNumber || '').toLowerCase().includes(q) ||
          String(inv.serviceName || inv.service || '').toLowerCase().includes(q)
        );
      })
    : invoices;

  return (
    <div style={page}>
      <h1 style={heading}>Invoices</h1>
      <p style={subText}>View and download your payment invoices.</p>

      {/* Filter bar */}
      <div style={filterBar}>
        <div style={labelWrap}>
          <span style={labelTxt}>Status</span>
          <select
            style={inputStyle}
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
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
        <div style={labelWrap}>
          <span style={labelTxt}>Search</span>
          <input
            style={{ ...inputStyle, minWidth: 160 }}
            type="text"
            placeholder="Invoice # or service"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          />
        </div>
        <button style={applyBtn} onClick={handleApply}>
          Apply
        </button>
        <button style={resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <InvoiceList invoices={displayed} onDownload={handleDownload} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationRow}>
          <button
            style={pageBtn(false)}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} style={pageBtn(n === page)} onClick={() => setPage(n)}>
              {n}
            </button>
          ))}
          <button
            style={pageBtn(false)}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
