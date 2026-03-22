import React, { useState, useEffect } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import CardElement from './CardElement';
import { createPaymentIntent, processPayment } from '../../services/paymentService';

// Props:
//   booking           {Object}   – { bookingId, serviceName, totalPrice }
//   onSuccess         {Function} – called with payment result
//   onError           {Function} – called with error message string
//   onProcessingChange {Function} – called with boolean to show/hide spinner in parent

const TAX_RATE = 0.085;

const fieldStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '2px solid #d1d5db',
  borderRadius: 7,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle = {
  display: 'block',
  marginBottom: 5,
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
};

const rowStyle = {
  display: 'flex',
  gap: 12,
  marginBottom: 14,
};

const colStyle = { flex: 1 };

const breakdownRow = {
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
  borderTop: '1px solid #e5e7eb',
  paddingTop: 8,
  marginTop: 8,
};

const sectionHeading = {
  fontSize: 13,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  margin: '0 0 10px',
};

const promoRow = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
};

const promoInput = {
  flex: 1,
  padding: '9px 12px',
  border: '2px solid #d1d5db',
  borderRadius: 7,
  fontSize: 14,
  outline: 'none',
};

const promoBtn = {
  padding: '9px 16px',
  background: '#f3f4f6',
  border: '2px solid #d1d5db',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  color: '#374151',
};

const payBtn = (disabled) => ({
  width: '100%',
  padding: '13px',
  background: disabled ? '#a0aec0' : '#635bff',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: 20,
  transition: 'background 0.2s',
  letterSpacing: 0.3,
});

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 6,
  padding: '9px 12px',
  color: '#b91c1c',
  fontSize: 13,
  marginTop: 12,
};

const CheckoutForm = ({ booking, onSuccess, onError, onProcessingChange }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState('');
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [intentError, setIntentError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const [billing, setBilling] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
  });

  const subtotal = Number(booking?.totalPrice || 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  useEffect(() => {
    if (!booking?.bookingId) return;
    setLoadingIntent(true);
    createPaymentIntent(booking.bookingId)
      .then((res) => {
        setClientSecret(res.data.clientSecret);
        setLoadingIntent(false);
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message || 'Failed to initialise payment. Please try again.';
        setIntentError(msg);
        setLoadingIntent(false);
      });
  }, [booking?.bookingId]);

  const handleBillingChange = (e) => {
    setBilling((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setLoading = (val) => {
    setProcessing(val);
    onProcessingChange && onProcessingChange(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setFormError('');
    setLoading(true);

    try {
      const cardElement = elements.getElement('card');
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billing.name,
            address: {
              line1: billing.address,
              city: billing.city,
              postal_code: billing.zip,
            },
          },
        },
      });

      if (error) {
        setFormError(error.message);
        onError && onError(error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        await processPayment({
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentIntent.payment_method,
          bookingId: booking.bookingId,
        });
        setLoading(false);
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An unexpected error occurred.';
      setFormError(msg);
      onError && onError(msg);
      setLoading(false);
    }
  };

  if (loadingIntent) {
    return <p style={{ color: '#888', textAlign: 'center' }}>Loading payment details…</p>;
  }

  if (intentError) {
    return <div style={errorBox}>{intentError}</div>;
  }

  const isDisabled = processing || !stripe;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Price breakdown */}
      <div style={{ marginBottom: 20 }}>
        <p style={sectionHeading}>Order Summary</p>
        <div style={breakdownRow}>
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={breakdownRow}>
          <span>Tax (8.5%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div style={totalRow}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Promo code */}
      <div style={{ marginBottom: 16 }}>
        <p style={sectionHeading}>Promo Code</p>
        <div style={promoRow}>
          <input
            style={promoInput}
            type="text"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            aria-label="Promo code"
          />
          <button type="button" style={promoBtn} onClick={() => {}}>
            Apply
          </button>
        </div>
      </div>

      {/* Card */}
      <div style={{ marginBottom: 18 }}>
        <p style={sectionHeading}>Payment Details</p>
        <CardElement />
      </div>

      {/* Billing address */}
      <div style={{ marginBottom: 4 }}>
        <p style={sectionHeading}>Billing Address</p>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="billing-name" style={labelStyle}>
            Full Name
          </label>
          <input
            id="billing-name"
            style={fieldStyle}
            name="name"
            type="text"
            placeholder="Jane Doe"
            value={billing.name}
            onChange={handleBillingChange}
            required
            autoComplete="name"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="billing-address" style={labelStyle}>
            Address
          </label>
          <input
            id="billing-address"
            style={fieldStyle}
            name="address"
            type="text"
            placeholder="123 Main St"
            value={billing.address}
            onChange={handleBillingChange}
            autoComplete="street-address"
          />
        </div>
        <div style={rowStyle}>
          <div style={colStyle}>
            <label htmlFor="billing-city" style={labelStyle}>
              City
            </label>
            <input
              id="billing-city"
              style={fieldStyle}
              name="city"
              type="text"
              placeholder="New York"
              value={billing.city}
              onChange={handleBillingChange}
              autoComplete="address-level2"
            />
          </div>
          <div style={colStyle}>
            <label htmlFor="billing-zip" style={labelStyle}>
              ZIP Code
            </label>
            <input
              id="billing-zip"
              style={fieldStyle}
              name="zip"
              type="text"
              placeholder="10001"
              value={billing.zip}
              onChange={handleBillingChange}
              autoComplete="postal-code"
            />
          </div>
        </div>
      </div>

      {formError && (
        <div style={errorBox} role="alert">
          {formError}
        </div>
      )}

      <button type="submit" style={payBtn(isDisabled)} disabled={isDisabled}>
        {processing ? 'Processing…' : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  );
};

export default CheckoutForm;