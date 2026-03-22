const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      default: 'USD',
      maxlength: 3
    },
    cardLast4: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, 'Stripe payment intent ID is required'],
      unique: true
    },
    stripeChargeId: {
      type: String,
      default: ''
    },
    receiptNumber: {
      type: String,
      default: ''
    },
    metadata: {
      type: Map,
      of: String,
      default: {}
    }
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
