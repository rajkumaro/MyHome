import React, { useState } from 'react';
import { CardElement as StripeCardElement, useElements } from '@stripe/react-stripe-js';

// Props:
//   onChange {Function} – optional callback with Stripe CardElement change event

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1a1a2e',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, sans-serif',
      fontSize: '15px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#a0aec0' },
      iconColor: '#635bff',
    },
    invalid: {
      color: '#e53e3e',
      iconColor: '#e53e3e',
    },
  },
  hidePostalCode: true,
};

const BRAND_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  diners: 'Diners',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: '',
};

const wrapper = {
  marginBottom: 8,
};

const label = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  letterSpacing: 0.2,
};

const getContainerStyle = (focused, hasError) => ({
  border: `2px solid ${hasError ? '#e53e3e' : focused ? '#635bff' : '#d1d5db'}`,
  borderRadius: 8,
  padding: '11px 14px',
  background: '#fff',
  transition: 'border-color 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

const brandBadge = {
  fontSize: 11,
  fontWeight: 700,
  background: '#635bff',
  color: '#fff',
  borderRadius: 4,
  padding: '1px 6px',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
};

const errorText = {
  marginTop: 5,
  fontSize: 12,
  color: '#e53e3e',
  minHeight: 16,
};

const CardElement = ({ onChange }) => {
  const [focused, setFocused] = useState(false);
  const [cardError, setCardError] = useState('');
  const [brand, setBrand] = useState('unknown');

  const handleChange = (event) => {
    setCardError(event.error ? event.error.message : '');
    setBrand(event.brand || 'unknown');
    onChange && onChange(event);
  };

  return (
    <div style={wrapper}>
      <label htmlFor="card-element" style={label}>
        Card Details
      </label>
      <div style={getContainerStyle(focused, !!cardError)}>
        <div style={{ flex: 1 }}>
          <StripeCardElement
            id="card-element"
            options={CARD_ELEMENT_OPTIONS}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={handleChange}
          />
        </div>
        {brand && brand !== 'unknown' && (
          <span style={brandBadge}>{BRAND_LABELS[brand] || brand}</span>
        )}
      </div>
      <div style={errorText} role="alert" aria-live="polite">
        {cardError}
      </div>
    </div>
  );
};

export default CardElement;
