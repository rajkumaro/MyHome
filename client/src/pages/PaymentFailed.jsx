import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const page = {
  maxWidth: 480,
  margin: '60px auto',
  textAlign: 'center',
  fontFamily: '"Inter", sans-serif',
  padding: '0 20px',
};

const errorCircle = {
  width: 90,
  height: 90,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  fontSize: 42,
  color: '#fff',
  boxShadow: '0 4px 20px rgba(239,68,68,0.35)',
};

const heading = {
  fontSize: 28,
  fontWeight: 800,
  color: '#991b1b',
  marginBottom: 10,
};

const reasonBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 10,
  padding: '14px 18px',
  marginBottom: 28,
  color: '#b91c1c',
  fontSize: 14,
};

const primaryBtn = {
  display: 'block',
  width: '100%',
  padding: '13px',
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

const supportLink = {
  display: 'block',
  marginTop: 12,
  color: '#6b7280',
  fontSize: 13,
};

const PaymentFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, error } = location.state || {};

  const handleTryAgain = () => {
    navigate('/checkout', { state: { booking } });
  };

  const handleDifferentCard = () => {
    navigate('/checkout', { state: { booking, changeCard: true } });
  };

  return (
    <div style={page}>
      {/* Icon */}
      <div style={errorCircle}>✗</div>

      <h1 style={heading}>Payment Failed</h1>

      {/* Reason */}
      {error ? (
        <div style={reasonBox}>
          <strong>Reason:</strong> {error}
        </div>
      ) : (
        <p style={{ color: '#6b7280', marginBottom: 28, fontSize: 14 }}>
          Your payment could not be processed. Please try again or use a different card.
        </p>
      )}

      {/* Actions */}
      <button style={primaryBtn} onClick={handleTryAgain}>
        Try Again
      </button>

      <button style={secondaryBtn} onClick={handleDifferentCard}>
        Try Different Card
      </button>

      <button style={secondaryBtn} onClick={() => navigate(-2)}>
        Back to Checkout
      </button>

      <a href="mailto:support@myhome.com" style={supportLink}>
        Contact Support
      </a>
    </div>
  );
};

export default PaymentFailed;