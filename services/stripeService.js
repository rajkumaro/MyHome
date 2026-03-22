const { stripe } = require('../config/stripe');

/**
 * Create a Stripe PaymentIntent.
 * @param {number} amount - amount in smallest currency unit (cents)
 * @param {string} currency
 * @param {Object} metadata
 */
const createPaymentIntent = async (amount, currency, metadata = {}) => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
    description: `MyHome booking payment — booking ${metadata.bookingId || ''}`
  });
};

/**
 * Retrieve an existing PaymentIntent.
 * @param {string} paymentIntentId
 */
const getPaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

/**
 * Confirm a PaymentIntent with a payment method.
 * @param {string} paymentIntentId
 * @param {string} paymentMethodId
 */
const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  return stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId
  });
};

/**
 * Create a refund for a charge.
 * @param {string} chargeId
 * @param {number|undefined} amount - amount in cents; omit for full refund
 */
const createRefund = async (chargeId, amount) => {
  const params = { charge: chargeId };
  if (amount) params.amount = amount;
  return stripe.refunds.create(params);
};

/**
 * Retrieve a payment method from Stripe.
 * @param {string} paymentMethodId
 */
const getPaymentMethod = async (paymentMethodId) => {
  return stripe.paymentMethods.retrieve(paymentMethodId);
};

/**
 * Detach a payment method from its customer.
 * @param {string} paymentMethodId
 */
const detachPaymentMethod = async (paymentMethodId) => {
  return stripe.paymentMethods.detach(paymentMethodId);
};

/**
 * Verify a Stripe webhook signature.
 * @param {Buffer} payload - raw request body
 * @param {string} signature - Stripe-Signature header
 * @param {string} secret
 */
const constructWebhookEvent = (payload, signature, secret) => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  getPaymentMethod,
  detachPaymentMethod,
  constructWebhookEvent
};
