import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/Payment/CheckoutForm';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
  : null;

const page = {
  maxWidth: 560,
  margin: '40px auto',
  padding: '0 20px',
  fontFamily: '"Inter", sans-serif',
};

const card = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '28px 28px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
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
  fontSize: 14,
  color: '#444',
  marginBottom: 6,
};

const heading = { fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 };
const subHeading = { fontSize: 13, color: '#6b7280', marginBottom: 24 };

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

const Spinner = () => (
  <div style={{ textAlign: 'center', padding: 60 }}>
    <div
      style={{
        width: 40,
        height: 40,
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #635bff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ color: '#888', marginTop: 12 }}>Loading booking details…</p>
  </div>
);

const CheckoutPage = () => {
  const location = useLocation();
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (booking) return;
    // If no booking in state, try to fetch from API using bookingId param
    if (!bookingId) {
      setFetchError('No booking information provided.');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    fetch(`/api/bookings/${bookingId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error('Booking not found');
        return r.json();
      })
      .then((data) => {
        setBooking(data.booking || data);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message || 'Failed to load booking.');
        setLoading(false);
      });
  }, [booking, bookingId]);

  const handleSuccess = (paymentIntent) => {
    navigate('/payment/success', {
      state: { booking, paymentIntentId: paymentIntent.id },
    });
  };

  const handleError = (msg) => {
    navigate('/payment/failed', { state: { booking, error: msg } });
  };

  if (loading) return <Spinner />;

  if (!stripePromise) {
    return (
      <div style={{ ...page, textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: '#dc2626', fontSize: 15 }}>
          Payment is unavailable: Stripe publishable key is not configured. Please contact support.
        </p>
        <button style={{ ...backBtn, marginTop: 16 }} onClick={() => navigate('/bookings')}>
          ← Back to Bookings
        </button>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ ...page, textAlign: 'center', paddingTop: 60 }}>
        <p style={{ color: '#dc2626', fontSize: 15 }}>{fetchError}</p>
        <button style={{ ...backBtn, marginTop: 16 }} onClick={() => navigate('/bookings')}>
          ← Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div style={page}>
      <button style={backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 style={heading}>Checkout</h1>
      <p style={subHeading}>Complete your payment securely using Stripe.</p>

      {booking && (
        <div style={{ ...card, marginBottom: 20 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Booking Summary
          </p>
          <div style={summaryBox}>
            <div style={summaryRow}>
              <span style={{ fontWeight: 600 }}>Service</span>
              <span>{booking.serviceName || '—'}</span>
            </div>
            {booking.serviceDate && (
              <div style={summaryRow}>
                <span style={{ fontWeight: 600 }}>Date</span>
                <span>{new Date(booking.serviceDate).toLocaleDateString()}</span>
              </div>
            )}
            {booking.providerName && (
              <div style={summaryRow}>
                <span style={{ fontWeight: 600 }}>Provider</span>
                <span>{booking.providerName}</span>
              </div>
            )}
            <div style={{ ...summaryRow, fontWeight: 700, fontSize: 15, marginBottom: 0 }}>
              <span>Subtotal</span>
              <span>${Number(booking.totalPrice || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div style={card}>
        <Elements stripe={stripePromise}>
          <CheckoutForm
            booking={booking}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </Elements>
      </div>
    </div>
  );
};

export default CheckoutPage;