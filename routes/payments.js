const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  validateCreatePaymentIntent,
  validateProcessPayment,
  validateRefund,
} = require('../middleware/validatePayment');
const {
  createPaymentIntent,
  processPayment,
  getPaymentHistory,
  getInvoice,
  refundPayment,
  handleWebhook,
} = require('../controllers/paymentController');

// Webhook must be first (raw body already applied in server.js)
router.post('/webhook', handleWebhook);

router.post('/create-intent', auth, validateCreatePaymentIntent, createPaymentIntent);
router.post('/process', auth, validateProcessPayment, processPayment);
router.get('/history', auth, getPaymentHistory);
router.get('/invoice/:bookingId', auth, getInvoice);
router.post('/refund', auth, validateRefund, refundPayment);

module.exports = router;
