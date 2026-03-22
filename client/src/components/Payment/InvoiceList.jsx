import React from 'react';

// Props:
//   invoices  {Array}    – list of invoice objects
//   onDownload {Function} – called with bookingId to download PDF
//   loading   {boolean}

const STATUS_STYLES = {
  paid: { background: '#d1fae5', color: '#065f46' },
  pending: { background: '#fef3c7', color: '#92400e' },
  overdue: { background: '#fee2e2', color: '#991b1b' },
  refunded: { background: '#ede9fe', color: '#5b21b6' },
};

const tableWrapper = {
  overflowX: 'auto',
  width: '100%',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
  minWidth: 600,
};

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
  verticalAlign: 'middle',
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

const downloadBtn = {
  background: '#635bff',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  marginRight: 6,
};

const viewLink = {
  color: '#635bff',
  textDecoration: 'underline',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
};

const emptyState = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#9ca3af',
  fontSize: 15,
};

const skeletonRow = {
  height: 18,
  background: '#e5e7eb',
  borderRadius: 4,
  width: '80%',
  display: 'inline-block',
  animation: 'pulse 1.5s ease-in-out infinite',
};

const InvoiceList = ({ invoices = [], onDownload, loading }) => {
  if (loading) {
    return (
      <div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={skeletonRow} />
          </div>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div style={emptyState}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
        <p style={{ fontWeight: 600, color: '#6b7280' }}>No invoices found</p>
        <p style={{ fontSize: 13 }}>Completed bookings will appear here.</p>
      </div>
    );
  }

  return (
    <div style={tableWrapper}>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Invoice #</th>
            <th style={th}>Date</th>
            <th style={th}>Service</th>
            <th style={th}>Amount</th>
            <th style={th}>Status</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const invoiceId = inv.invoiceNumber || inv._id || inv.id;
            const bookingId = inv.bookingId || inv._id || inv.id;
            return (
              <tr key={invoiceId} style={{ transition: 'background 0.15s' }}>
                <td style={td}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {invoiceId}
                  </span>
                </td>
                <td style={td}>
                  {inv.date
                    ? new Date(inv.date).toLocaleDateString()
                    : inv.createdAt
                    ? new Date(inv.createdAt).toLocaleDateString()
                    : '—'}
                </td>
                <td style={td}>{inv.serviceName || inv.service || '—'}</td>
                <td style={{ ...td, fontWeight: 600 }}>
                  ${Number(inv.amount || inv.totalAmount || 0).toFixed(2)}
                </td>
                <td style={td}>
                  <span style={statusBadge(inv.status)}>{inv.status || 'Unknown'}</span>
                </td>
                <td style={td}>
                  <button style={downloadBtn} onClick={() => onDownload && onDownload(bookingId)}>
                    ↓ PDF
                  </button>
                  <button style={viewLink} onClick={() => {}}>
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;