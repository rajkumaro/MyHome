const { stripe } = require('../config/stripe');

/**
 * Create a Stripe PaymentIntent.
 * @param {number} amount - Amount in cents
 * @param {string} currency
 * @param {object} metadata
 */
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
};

/**
 * Confirm a PaymentIntent by ID.
 * @param {string} paymentIntentId
 */
const confirmPaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.confirm(paymentIntentId);
};

/**
 * Create a refund.
 * @param {string} chargeId
 * @param {number|undefined} amount - In cents; omit for full refund
 */
const createRefund = async (chargeId, amount) => {
  const params = { charge: chargeId };
  if (amount) params.amount = amount;
  return stripe.refunds.create(params);
};

/**
 * Attach a payment method to a customer.
 * @param {string} customerId
 * @param {string} paymentMethodId
 */
const attachPaymentMethod = async (customerId, paymentMethodId) => {
  return stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
};

/**
 * Detach a payment method from its customer.
 * @param {string} paymentMethodId
 */
const detachPaymentMethod = async (paymentMethodId) => {
  return stripe.paymentMethods.detach(paymentMethodId);
};

/**
 * List all payment methods for a customer.
 * @param {string} customerId
 */
const listPaymentMethods = async (customerId) => {
  return stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
};

/**
 * Create a Stripe Customer.
 * @param {string} email
 * @param {string} name
 */
const createCustomer = async (email, name) => {
  return stripe.customers.create({ email, name });
};

/**
 * Retrieve a PaymentIntent by ID.
 * @param {string} paymentIntentId
 */
const getPaymentIntent = async (paymentIntentId) => {
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  attachPaymentMethod,
  detachPaymentMethod,
  listPaymentMethods,
  createCustomer,
  getPaymentIntent,
};
