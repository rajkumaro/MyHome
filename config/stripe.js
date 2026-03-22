require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
});

const stripeConfig = {
  currency: process.env.STRIPE_CURRENCY || 'usd',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  publicKey: process.env.STRIPE_PUBLIC_KEY
};

module.exports = { stripe, stripeConfig };
