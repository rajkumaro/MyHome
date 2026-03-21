import React from 'react';

// Props:
//   invoice    {Object}   – full invoice data object
//   onDownload {Function} – called with bookingId to trigger PDF download

const page = {
  maxWidth: 720,
  margin: '0 auto',
  fontFamily: '"Inter", sans-serif',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '36px 40px',
  color: '#1a1a2e',
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 32,
  paddingBottom: 20,
  borderBottom: '2px solid #635bff',
};

const companyName = { fontSize: 22, fontWeight: 800, color: '#635bff' };
const subText = { fontSize: 12, color: '#6b7280', marginTop: 2 };

const invoiceMeta = { textAlign: 'right' };
const metaLabel = { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.4 };
const metaValue = { fontSize: 14, fontWeight: 600, marginTop: 1 };

const partiesRow = {
  display: 'flex',
  gap: 32,
  marginBottom: 28,
};

const partyBox = { flex: 1 };
const partyHeading = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 8,
};

const tableWrapper = { overflowX: 'auto', marginBottom: 24 };
const table = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const th = {
  textAlign: 'left',
  padding: '9px 12px',
  background: '#f3f4f6',
  fontSize: 12,
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  borderBottom: '2px solid #e5e7eb',
};
const td = { padding: '10px 12px', borderBottom: '1px solid #f3f4f6' };

const totalsSection = {
  marginLeft: 'auto',
  maxWidth: 260,
  marginBottom: 24,
};

const totalsRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  color: '#555',
  marginBottom: 5,
};

const totalRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 16,
  fontWeight: 700,
  color: '#1a1a2e',
  borderTop: '2px solid #e5e7eb',
  paddingTop: 8,
  marginTop: 6,
};

const actionRow = { display: 'flex', gap: 10, marginTop: 24 };

const primaryBtn = {
  padding: '10px 20px',
  background: '#635bff',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryBtn = {
  padding: '10px 20px',
  background: '#fff',
  color: '#374151',
  border: '1.5px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const refundBanner = {
  background: '#ede9fe',
  border: '1px solid #c4b5fd',
  borderRadius: 7,
  padding: '10px 14px',
  color: '#5b21b6',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 16,
};

const InvoiceDetails = ({ invoice, onDownload }) => {
  if (!invoice) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No invoice data available.</p>;
  }

  const bookingId = invoice.bookingId || invoice._id || invoice.id;
  const subtotal = Number(invoice.subtotal || invoice.amount || 0);
  const tax = Number(invoice.tax || subtotal * 0.085);
  const total = Number(invoice.totalAmount || invoice.total || subtotal + tax);

  const items = invoice.items || [
    {
      description: invoice.serviceName || 'Service',
      quantity: 1,
      unitPrice: subtotal,
      amount: subtotal,
    },
  ];

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <div>
          <div style={companyName}>MyHome</div>
          <div style={subText}>Home Services Platform</div>
          <div style={{ ...subText, marginTop: 8 }}>support@myhome.com</div>
        </div>
        <div style={invoiceMeta}>
          <div style={metaLabel}>Invoice</div>
          <div style={{ ...metaValue, fontSize: 18, color: '#635bff' }}>
            #{invoice.invoiceNumber || bookingId}
          </div>
          <div style={{ ...metaLabel, marginTop: 10 }}>Date</div>
          <div style={metaValue}>
            {invoice.date
              ? new Date(invoice.date).toLocaleDateString()
              : invoice.createdAt
              ? new Date(invoice.createdAt).toLocaleDateString()
              : '—'}
          </div>
          {invoice.dueDate && (
            <>
              <div style={{ ...metaLabel, marginTop: 8 }}>Due Date</div>
              <div style={metaValue}>{new Date(invoice.dueDate).toLocaleDateString()}</div>
            </>
          )}
        </div>
      </div>

      {/* Bill From / Bill To */}
      <div style={partiesRow}>
        <div style={partyBox}>
          <div style={partyHeading}>Bill From</div>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>
            {invoice.providerName || invoice.provider?.name || 'Service Provider'}
          </div>
          {invoice.providerEmail && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>{invoice.providerEmail}</div>
          )}
          {invoice.providerAddress && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>{invoice.providerAddress}</div>
          )}
        </div>
        <div style={partyBox}>
          <div style={partyHeading}>Bill To</div>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>
            {invoice.clientName || invoice.client?.name || 'Client'}
          </div>
          {invoice.clientEmail && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>{invoice.clientEmail}</div>
          )}
          {invoice.clientAddress && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>{invoice.clientAddress}</div>
          )}
        </div>
      </div>

      {/* Refund banner */}
      {invoice.refundStatus && (
        <div style={refundBanner}>
          Refund Status: {invoice.refundStatus}
          {invoice.refundAmount && ` — $${Number(invoice.refundAmount).toFixed(2)} refunded`}
        </div>
      )}

      {/* Line items table */}
      <div style={tableWrapper}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Description</th>
              <th style={{ ...th, textAlign: 'center' }}>Qty</th>
              <th style={{ ...th, textAlign: 'right' }}>Unit Price</th>
              <th style={{ ...th, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={td}>{item.description}</td>
                <td style={{ ...td, textAlign: 'center' }}>{item.quantity ?? 1}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  ${Number(item.unitPrice || item.amount || 0).toFixed(2)}
                </td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>
                  ${Number(item.amount || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={totalsSection}>
        <div style={totalsRow}>
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={totalsRow}>
          <span>Tax (8.5%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div style={totalRow}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment details */}
      {(invoice.paymentMethod || invoice.paidAt || invoice.paymentDate) && (
        <div
          style={{
            background: '#f9fafb',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 13,
            color: '#374151',
            marginBottom: 16,
          }}
        >
          {invoice.paymentMethod && (
            <div>
              <strong>Payment Method:</strong> {invoice.paymentMethod}
            </div>
          )}
          {(invoice.paidAt || invoice.paymentDate) && (
            <div style={{ marginTop: 4 }}>
              <strong>Payment Date:</strong>{' '}
              {new Date(invoice.paidAt || invoice.paymentDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={actionRow}>
        <button style={primaryBtn} onClick={() => onDownload && onDownload(bookingId)}>
          ↓ Download PDF
        </button>
        <button style={secondaryBtn} onClick={() => window.print()}>
          🖨 Print
        </button>
      </div>
    </div>
  );
};

export default InvoiceDetails;
