const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  validateCreatePaymentIntent,
  validateProcessPayment,
  validateRefund
} = require('../middleware/validatePayment');
const {
  createPaymentIntent,
  processPayment,
  getPaymentHistory,
  getInvoice,
  refundPayment,
  handleWebhook,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod
} = require('../controllers/paymentController');

// Webhook — no auth, raw body required (see server.js)
router.post('/webhook', handleWebhook);

// All routes below require authentication
router.use(auth);

router.post('/create-intent', validateCreatePaymentIntent, createPaymentIntent);
router.post('/process', validateProcessPayment, processPayment);
router.get('/history', getPaymentHistory);
router.get('/invoice/:bookingId', getInvoice);
router.post('/refund', validateRefund, refundPayment);

// Payment methods management
router.get('/methods', getPaymentMethods);
router.post('/methods', addPaymentMethod);
router.delete('/methods/:paymentMethodId', deletePaymentMethod);
router.put('/methods/:paymentMethodId/default', setDefaultPaymentMethod);

module.exports = router;
