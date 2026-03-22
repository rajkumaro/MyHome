import React from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadInvoice } from '../../services/paymentService';

// Props:
//   status  {'success' | 'failed'}
//   booking {Object}   – { bookingId, serviceName, serviceDate, providerName, totalPrice }
//   error   {string}   – error message (used when status === 'failed')

const container = {
  maxWidth: 480,
  margin: '60px auto',
  textAlign: 'center',
  fontFamily: '"Inter", sans-serif',
  padding: '0 20px',
};

const iconCircle = (color) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  fontSize: 36,
});

const title = (color) => ({
  fontSize: 26,
  fontWeight: 800,
  color,
  marginBottom: 10,
});

const detailBox = {
  background: '#f9fafb',
  borderRadius: 10,
  padding: '16px 20px',
  marginTop: 20,
  marginBottom: 24,
  textAlign: 'left',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  color: '#374151',
  marginBottom: 7,
};

const primaryBtn = {
  display: 'block',
  width: '100%',
  padding: '12px',
  background: '#635bff',
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

const dangerBtn = {
  ...secondaryBtn,
  color: '#dc2626',
  borderColor: '#fecaca',
};

const PaymentStatus = ({ status, booking, error }) => {
  const navigate = useNavigate();
  const isSuccess = status === 'success';
  const bookingId = booking?.bookingId || booking?._id;

  const handleDownload = async () => {
    if (!bookingId) return;
    try {
      await downloadInvoice(bookingId);
    } catch {
      alert('Receipt download failed.');
    }
  };

  return (
    <div style={container}>
      {/* Icon */}
      <div style={iconCircle(isSuccess ? '#d1fae5' : '#fee2e2')}>
        {isSuccess ? '✓' : '✗'}
      </div>

      {/* Heading */}
      <h1 style={title(isSuccess ? '#065f46' : '#991b1b')}>
        {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
      </h1>

      {!isSuccess && error && (
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>{error}</p>
      )}

      {/* Booking details */}
      {booking && (
        <div style={detailBox}>
          {booking.serviceName && (
            <div style={detailRow}>
              <span style={{ fontWeight: 600 }}>Service</span>
              <span>{booking.serviceName}</span>
            </div>
          )}
          {booking.serviceDate && (
            <div style={detailRow}>
              <span style={{ fontWeight: 600 }}>Date</span>
              <span>{new Date(booking.serviceDate).toLocaleDateString()}</span>
            </div>
          )}
          {booking.providerName && (
            <div style={detailRow}>
              <span style={{ fontWeight: 600 }}>Provider</span>
              <span>{booking.providerName}</span>
            </div>
          )}
          {booking.totalPrice !== undefined && (
            <div style={{ ...detailRow, fontWeight: 700, fontSize: 15 }}>
              <span>Amount</span>
              <span>${Number(booking.totalPrice).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isSuccess ? (
        <>
          <button style={primaryBtn} onClick={handleDownload}>
            ↓ Download Receipt
          </button>
          <button style={secondaryBtn} onClick={() => navigate('/bookings')}>
            Back to My Bookings
          </button>
        </>
      ) : (
        <>
          <button style={primaryBtn} onClick={() => navigate(-1)}>
            Try Again
          </button>
          <button
            style={secondaryBtn}
            onClick={() => navigate('/checkout', { state: { booking, changeCard: true } })}
          >
            Try Different Card
          </button>
          <button style={dangerBtn} onClick={() => navigate('/bookings')}>
            Back to My Bookings
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentStatus;