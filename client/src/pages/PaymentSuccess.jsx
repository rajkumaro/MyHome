import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { downloadInvoice } from '../services/paymentService';

const page = {
  maxWidth: 520,
  margin: '60px auto',
  textAlign: 'center',
  fontFamily: '"Inter", sans-serif',
  padding: '0 20px',
};

const successCircle = {
  width: 90,
  height: 90,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #10b981, #059669)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  fontSize: 42,
  boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
};

const heading = {
  fontSize: 28,
  fontWeight: 800,
  color: '#065f46',
  marginBottom: 6,
};

const subText = {
  fontSize: 14,
  color: '#6b7280',
  marginBottom: 28,
};

const detailCard = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '18px 22px',
  textAlign: 'left',
  marginBottom: 24,
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  color: '#374151',
  marginBottom: 8,
};

const amountRow = {
  ...detailRow,
  fontWeight: 800,
  fontSize: 18,
  color: '#065f46',
  marginBottom: 0,
  marginTop: 8,
  paddingTop: 8,
  borderTop: '1px solid #e5e7eb',
};

const primaryBtn = {
  display: 'block',
  width: '100%',
  padding: '13px',
  background: '#10b981',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  marginBottom: 10,
};

const secondaryBtn = {
  display: 'block',
  width: '100%',
  padding: '11px',
  background: '#fff',
  color: '#374151',
  border: '1.5px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: 10,
};

const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#635bff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
  marginTop: 4,
};

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, paymentIntentId } = location.state || {};
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const bookingId = booking?.bookingId || booking?._id;

  const handleDownload = async () => {
    if (!bookingId) return;
    setDownloading(true);
    try {
      await downloadInvoice(bookingId);
    } catch {
      alert('Failed to download receipt. Please try from the Invoices page.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/bookings/${bookingId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={page}>
      {/* Icon */}
      <div style={successCircle}>✓</div>

      <h1 style={heading}>Payment Successful!</h1>
      <p style={subText}>
        Your booking is confirmed.{' '}
        {paymentIntentId && (
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af' }}>
            Ref: {paymentIntentId.slice(0, 18)}…
          </span>
        )}
      </p>

      {/* Booking details */}
      {booking && (
        <div style={detailCard}>
          {booking.serviceName && (
            <div style={detailRow}>
              <span style={{ fontWeight: 600 }}>Service</span>
              <span>{booking.serviceName}</span>
            </div>
          )}
          {booking.providerName && (
            <div style={detailRow}>
              <span style={{ fontWeight: 600 }}>Provider</span>
              <span>{booking.providerName}</span>
            </div>
          )}
          {booking.serviceDate && (
            <div style={detailRow}>
              <span style={{ fontWeight: 600 }}>Date</span>
              <span>{new Date(booking.serviceDate).toLocaleDateString()}</span>
            </div>
          )}
          {booking.serviceTime && (
            <div style={detailRow}>
              <span style={{ fontWeight: 600 }}>Time</span>
              <span>{booking.serviceTime}</span>
            </div>
          )}
          {booking.totalPrice !== undefined && (
            <div style={amountRow}>
              <span>Total Paid</span>
              <span>${Number(booking.totalPrice).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <button style={primaryBtn} onClick={handleDownload} disabled={downloading}>
        {downloading ? 'Downloading…' : '↓ Download Receipt'}
      </button>

      <button
        style={secondaryBtn}
        onClick={() => navigate('/invoices', { state: { bookingId } })}
      >
        View Invoice
      </button>

      <button style={secondaryBtn} onClick={() => navigate('/bookings')}>
        Back to My Bookings
      </button>

      <button style={linkBtn} onClick={handleShare}>
        {copied ? '✓ Link copied!' : '🔗 Share Confirmation'}
      </button>
    </div>
  );
};

export default PaymentSuccess;
