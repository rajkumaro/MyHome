import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useElements, useStripe, CardElement as StripeCardElement } from '@stripe/react-stripe-js';
import {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../../services/paymentService';

// Props: none (self-contained, reads from API)

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

/* ─── Styles ─────────────────────────────────────────────── */
const container = { maxWidth: 560, margin: '0 auto', fontFamily: 'sans-serif' };

const heading = { fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1a1a2e' };

const cardRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#f9fafb',
  border: '1.5px solid #e5e7eb',
  borderRadius: 9,
  padding: '14px 18px',
  marginBottom: 10,
};

const cardInfo = { display: 'flex', alignItems: 'center', gap: 12 };

const brandTag = {
  background: '#635bff',
  color: '#fff',
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
};

const defaultBadge = {
  background: '#d1fae5',
  color: '#065f46',
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 700,
};

const actionBtn = (color) => ({
  background: 'none',
  border: `1.5px solid ${color}`,
  color: color,
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  marginLeft: 6,
});

const addBtn = {
  marginTop: 14,
  padding: '10px 18px',
  background: '#635bff',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

const cancelBtn = {
  marginTop: 8,
  padding: '9px 16px',
  background: '#f3f4f6',
  color: '#374151',
  border: '1.5px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginLeft: 8,
};

const cardInputBox = {
  border: '2px solid #d1d5db',
  borderRadius: 8,
  padding: '11px 14px',
  background: '#fff',
  marginBottom: 10,
};

const messageBox = (type) => ({
  padding: '9px 13px',
  borderRadius: 6,
  marginBottom: 12,
  background: type === 'error' ? '#fef2f2' : '#ecfdf5',
  color: type === 'error' ? '#b91c1c' : '#065f46',
  fontSize: 13,
});

/* ─── AddCardForm (inner, needs Stripe hooks) ─────────────── */
const AddCardForm = ({ onAdded, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!stripe || !elements) return;
    setSaving(true);
    setError('');
    try {
      const cardElement = elements.getElement(StripeCardElement);
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      if (pmError) {
        setError(pmError.message);
        setSaving(false);
        return;
      }
      await addPaymentMethod(paymentMethod.id);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save card.');
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 16, background: '#f9fafb', borderRadius: 9, padding: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Add New Card</p>
      <div style={cardInputBox}>
        <StripeCardElement
          options={{
            style: {
              base: { fontSize: '15px', color: '#1a1a2e', '::placeholder': { color: '#a0aec0' } },
              invalid: { color: '#e53e3e' },
            },
            hidePostalCode: true,
          }}
        />
      </div>
      {error && <div style={messageBox('error')}>{error}</div>}
      <button style={addBtn} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Card'}
      </button>
      <button style={cancelBtn} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
};

/* ─── Main component ──────────────────────────────────────── */
const PaymentMethodsInner = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchMethods = () => {
    setLoading(true);
    getPaymentMethods()
      .then((res) => {
        setMethods(res.data.methods || res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load payment methods.');
        setLoading(false);
      });
  };

  useEffect(fetchMethods, []);

  const handleDelete = async (pmId) => {
    if (!window.confirm('Remove this card?')) return;
    try {
      await deletePaymentMethod(pmId);
      setMessage('Card removed.');
      fetchMethods();
    } catch {
      setError('Failed to remove card.');
    }
  };

  const handleSetDefault = async (pmId) => {
    try {
      await setDefaultPaymentMethod(pmId);
      setMessage('Default card updated.');
      fetchMethods();
    } catch {
      setError('Failed to update default card.');
    }
  };

  const handleAdded = () => {
    setShowAddForm(false);
    setMessage('Card saved successfully.');
    fetchMethods();
  };

  if (loading) return <p style={{ color: '#888' }}>Loading payment methods…</p>;

  return (
    <div style={container}>
      <h2 style={heading}>Payment Methods</h2>

      {error && <div style={messageBox('error')}>{error}</div>}
      {message && <div style={messageBox('success')}>{message}</div>}

      {methods.length === 0 && !showAddForm && (
        <p style={{ color: '#6b7280', marginBottom: 16 }}>No saved cards yet.</p>
      )}

      {methods.map((method) => {
        const card = method.card || method;
        const pmId = method.id || method.paymentMethodId;
        const isDefault = method.isDefault || method.default;
        return (
          <div key={pmId} style={cardRow}>
            <div style={cardInfo}>
              <span style={brandTag}>{card.brand || 'Card'}</span>
              <span style={{ fontSize: 14, color: '#374151' }}>
                •••• {card.last4}
              </span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>
                {card.exp_month}/{card.exp_year}
              </span>
              {isDefault && <span style={defaultBadge}>Default</span>}
            </div>
            <div>
              {!isDefault && (
                <button style={actionBtn('#635bff')} onClick={() => handleSetDefault(pmId)}>
                  Set Default
                </button>
              )}
              <button style={actionBtn('#ef4444')} onClick={() => handleDelete(pmId)}>
                Remove
              </button>
            </div>
          </div>
        );
      })}

      {!showAddForm ? (
        <button style={addBtn} onClick={() => setShowAddForm(true)}>
          + Add New Card
        </button>
      ) : (
        <AddCardForm onAdded={handleAdded} onCancel={() => setShowAddForm(false)} />
      )}
    </div>
  );
};

const PaymentMethods = () => (
  <Elements stripe={stripePromise}>
    <PaymentMethodsInner />
  </Elements>
);

export default PaymentMethods;
