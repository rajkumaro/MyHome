import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import PaymentHistory from './pages/PaymentHistory';
import InvoicesPage from './pages/InvoicesPage';
import RefundPage from './pages/RefundPage';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
  : null;

function App() {
  return (
    <Router>
      <Elements stripe={stripePromise}>
        <Routes>
          <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route path="/payment/history" element={<PaymentHistory />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/refund/:bookingId" element={<RefundPage />} />
          <Route path="/" element={<div style={{ padding: 40, textAlign: 'center' }}><h1>MyHome</h1><p>Service Provider Marketplace</p></div>} />
        </Routes>
      </Elements>
    </Router>
  );
}

export default App;
