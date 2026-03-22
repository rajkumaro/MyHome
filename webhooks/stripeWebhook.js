const stripeService = require('../services/stripeService');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const { stripeConfig } = require('../config/stripe');

const HANDLED_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
  'payment_method.detached'
];

const stripeWebhookHandler = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!stripeConfig.webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripeService.constructWebhookEvent(
      req.body,
      signature,
      stripeConfig.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (!HANDLED_EVENTS.includes(event.type)) {
    return res.status(200).json({ received: true });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: 'succeeded' }
        );
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: 'failed' }
        );

        const transaction = await Transaction.findOne({
          stripePaymentIntentId: paymentIntent.id
        });
        if (transaction) {
          await Booking.findByIdAndUpdate(transaction.bookingId, {
            paymentStatus: 'failed'
          });
        }
        console.log(`PaymentIntent failed: ${paymentIntent.id}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        if (paymentIntentId) {
          const transaction = await Transaction.findOneAndUpdate(
            { stripePaymentIntentId: paymentIntentId },
            { status: 'refunded' },
            { new: true }
          );

          if (transaction) {
            await Booking.findByIdAndUpdate(transaction.bookingId, {
              paymentStatus: 'refunded'
            });
          }
        }
        console.log(`Charge refunded: ${charge.id}`);
        break;
      }

      case 'payment_method.detached': {
        const paymentMethod = event.data.object;
        console.log(`PaymentMethod detached: ${paymentMethod.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for event ${event.type}:`, err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = stripeWebhookHandler;
