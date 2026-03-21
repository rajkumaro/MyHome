const { stripe, stripeConfig } = require('../config/stripe');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');

/**
 * Verify Stripe webhook signature and dispatch event handlers.
 * Expects req.body to be the raw Buffer (set by express.raw in server.js).
 */
const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeConfig.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: 'succeeded' }
        );
        const bookingId = paymentIntent.metadata?.bookingId;
        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid' });
        }
        console.log(`payment_intent.succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: 'failed' }
        );
        const bookingId = paymentIntent.metadata?.bookingId;
        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'failed' });
        }
        console.log(`payment_intent.payment_failed: ${paymentIntent.id}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const transaction = await Transaction.findOne({ stripeChargeId: charge.id });
        if (transaction) {
          transaction.status = 'refunded';
          await transaction.save();
          await Booking.findByIdAndUpdate(transaction.bookingId, { paymentStatus: 'refunded' });
        }
        console.log(`charge.refunded: ${charge.id}`);
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object;
        await Transaction.findOneAndUpdate(
          { stripeChargeId: charge.id },
          { status: 'failed' }
        );
        console.log(`charge.failed: ${charge.id}`);
        break;
      }

      case 'payment_method.detached': {
        const paymentMethod = event.data.object;
        // No DB action needed beyond logging for now
        console.log(`payment_method.detached: ${paymentMethod.id}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = stripeWebhookHandler;
