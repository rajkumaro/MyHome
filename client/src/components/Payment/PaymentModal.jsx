import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// Props:
//   isOpen    {boolean}  – whether the modal is visible
//   onClose   {Function} – called when the user dismisses the modal
//   booking   {Object}   – { bookingId, serviceName, serviceDate, providerName, totalPrice }
//   onSuccess {Function} – called with the payment result on success

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modal = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  width: '100%',
  maxWidth: 520,
  padding: '32px 28px',
  position: 'relative',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const closeBtn = {
  position: 'absolute',
  top: 14,
  right: 18,
  background: 'none',
  border: 'none',
  fontSize: 22,
  cursor: 'pointer',
  color: '#666',
  lineHeight: 1,
};

const summaryBox = {
  background: '#f7f8fa',
  borderRadius: 8,
  padding: '14px 16px',
  marginBottom: 24,
};

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 6,
  fontSize: 14,
  color: '#444',
};

const summaryLabel = { fontWeight: 600 };

const heading = {
  margin: '0 0 20px',
  fontSize: 20,
  fontWeight: 700,
  color: '#1a1a2e',
};

const Spinner = () => (
  <div style={{ textAlign: 'center', padding: 24 }}>
    <div
      style={{
        width: 36,
        height: 36,
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #635bff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ color: '#888', marginTop: 10 }}>Processing…</p>
  </div>
);

const PaymentModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  if (!isOpen || !booking) return null;

  const handleSuccess = (result) => {
    setProcessing(false);
    setMessage({ type: 'success', text: 'Payment successful! 🎉' });
    setTimeout(() => {
      setMessage(null);
      onSuccess && onSuccess(result);
      onClose();
    }, 1500);
  };

  const handleError = (errMsg) => {
    setProcessing(false);
    setMessage({ type: 'error', text: errMsg });
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal} role="dialog" aria-modal="true" aria-label="Payment">
        <button style={closeBtn} onClick={onClose} aria-label="Close payment modal">
          ×
        </button>

        <h2 style={heading}>Complete Payment</h2>

        {/* Booking summary */}
        <div style={summaryBox}>
          <div style={summaryRow}>
            <span style={summaryLabel}>Service</span>
            <span>{booking.serviceName}</span>
          </div>
          {booking.serviceDate && (
            <div style={summaryRow}>
              <span style={summaryLabel}>Date</span>
              <span>{new Date(booking.serviceDate).toLocaleDateString()}</span>
            </div>
          )}
          {booking.providerName && (
            <div style={summaryRow}>
              <span style={summaryLabel}>Provider</span>
              <span>{booking.providerName}</span>
            </div>
          )}
          <div style={{ ...summaryRow, marginBottom: 0, fontWeight: 700, fontSize: 15 }}>
            <span>Amount Due</span>
            <span>${Number(booking.totalPrice || 0).toFixed(2)}</span>
          </div>
        </div>

        {processing && <Spinner />}

        {message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 6,
              marginBottom: 16,
              background: message.type === 'success' ? '#e6f9ee' : '#ffeaea',
              color: message.type === 'success' ? '#1a7a44' : '#c0392b',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {message.text}
          </div>
        )}

        {!processing && !message?.type === 'success' && (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              booking={booking}
              onSuccess={handleSuccess}
              onError={handleError}
              onProcessingChange={setProcessing}
            />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
