import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { refundPayment } from '../services/paymentService';

// Refund reason options
const REASONS = [
  { value: '', label: 'Select a reason…' },
  { value: 'service_not_performed', label: 'Service not performed' },
  { value: 'quality_issues', label: 'Quality issues' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'other', label: 'Other' },
];

const page = {
  maxWidth: 600,
  margin: '40px auto',
  padding: '0 20px',
  fontFamily: '"Inter", sans-serif',
};

const card = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '28px 28px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  marginBottom: 20,
};

const heading = { fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 };
const subText = { fontSize: 13, color: '#6b7280', marginBottom: 24 };

const bookingRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  color: '#374151',
  marginBottom: 8,
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 5,
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '2px solid #d1d5db',
  borderRadius: 7,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 16,
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 90,
};

const checkRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 14,
  fontSize: 14,
  color: '#374151',
};

const submitBtn = (disabled) => ({
  width: '100%',
  padding: '13px',
  background: disabled ? '#a0aec0' : '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: 4,
});

const backBtn = {
  background: 'none',
  border: 'none',
  color: '#635bff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: 20,
  padding: 0,
};

const successCard = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: 12,
  padding: '28px',
  textAlign: 'center',
};

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 7,
  padding: '10px 14px',
  color: '#b91c1c',
  fontSize: 13,
  marginBottom: 14,
};

const fileLabel = {
  display: 'inline-block',
  padding: '8px 16px',
  background: '#f3f4f6',
  border: '1.5px dashed #d1d5db',
  borderRadius: 7,
  fontSize: 13,
  color: '#374151',
  cursor: 'pointer',
  marginBottom: 16,
};

const RefundPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // refund confirmation

  // Fetch booking details
  useEffect(() => {
    if (!bookingId) return;
    const token = localStorage.getItem('token');
    fetch(`/api/bookings/${bookingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setBooking(data.booking || data))
      .catch(() => setBooking({ bookingId }));
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for the refund.');
      return;
    }
    if (partial) {
      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid refund amount greater than zero.');
        return;
      }
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        bookingId,
        reason,
        ...(comments && { comments }),
        // Convert dollars → cents to match the Stripe/backend convention
        ...(partial && amount ? { amount: Math.round(parseFloat(amount) * 100) } : {}),
      };
      const res = await refundPayment(payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit refund request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (result) {
    const refNo = result.refundId || result.reference || result._id || 'N/A';
    const expected = result.expectedDate || '5–10 business days';
    return (
      <div style={page}>
        <div style={successCard}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontWeight: 800, color: '#065f46', marginBottom: 8 }}>
            Refund Request Submitted
          </h2>
          <p style={{ color: '#374151', fontSize: 14, marginBottom: 4 }}>
            Reference Number: <strong>{refNo}</strong>
          </p>
          <p style={{ color: '#374151', fontSize: 14, marginBottom: 20 }}>
            Expected refund date: <strong>{expected}</strong>
          </p>
          <button
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              marginRight: 8,
            }}
            onClick={() => navigate('/payment-history')}
          >
            View Refund Status
          </button>
          <button
            style={{
              padding: '10px 20px',
              background: '#fff',
              color: '#374151',
              border: '1.5px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/bookings')}
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <button style={backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 style={heading}>Request a Refund</h1>
      <p style={subText}>Complete the form below to request a refund for your booking.</p>

      {/* Booking summary */}
      {booking && (
        <div style={card}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Booking Details
          </p>
          {booking.serviceName && (
            <div style={bookingRow}>
              <span style={{ fontWeight: 600 }}>Service</span>
              <span>{booking.serviceName}</span>
            </div>
          )}
          {booking.providerName && (
            <div style={bookingRow}>
              <span style={{ fontWeight: 600 }}>Provider</span>
              <span>{booking.providerName}</span>
            </div>
          )}
          {booking.serviceDate && (
            <div style={bookingRow}>
              <span style={{ fontWeight: 600 }}>Date</span>
              <span>{new Date(booking.serviceDate).toLocaleDateString()}</span>
            </div>
          )}
          {booking.totalPrice !== undefined && (
            <div style={{ ...bookingRow, fontWeight: 700, fontSize: 15 }}>
              <span>Amount Paid</span>
              <span>${Number(booking.totalPrice).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Refund form */}
      <div style={card}>
        <form onSubmit={handleSubmit} noValidate>
          {error && <div style={errorBox}>{error}</div>}

          {/* Reason */}
          <label htmlFor="refund-reason" style={labelStyle}>
            Reason for Refund *
          </label>
          <select
            id="refund-reason"
            style={inputStyle}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value} disabled={r.value === ''}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Comments */}
          <label htmlFor="refund-comments" style={labelStyle}>
            Additional Comments
          </label>
          <textarea
            id="refund-comments"
            style={textareaStyle}
            placeholder="Please describe the issue in detail…"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />

          {/* Partial refund toggle */}
          <div style={checkRow}>
            <input
              id="partial-check"
              type="checkbox"
              checked={partial}
              onChange={(e) => setPartial(e.target.checked)}
            />
            <label htmlFor="partial-check">Request partial refund</label>
          </div>

          {partial && (
            <>
              <label htmlFor="refund-amount" style={labelStyle}>
                Refund Amount ($)
              </label>
              <input
                id="refund-amount"
                style={inputStyle}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </>
          )}

          {/* Supporting document upload (UI only) */}
          <label style={labelStyle}>Supporting Document (optional)</label>
          <label style={fileLabel} htmlFor="refund-doc">
            📎 Attach file
            <input id="refund-doc" type="file" style={{ display: 'none' }} accept="image/*,.pdf" />
          </label>

          <button type="submit" style={submitBtn(submitting)} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Refund Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RefundPage;