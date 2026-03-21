const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
      comment: 'Amount in cents',
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
    },
    paymentMethodId: {
      type: String,
      default: '',
      comment: 'Last 4 digits of the card',
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    stripePaymentIntentId: {
      type: String,
      default: '',
    },
    stripeChargeId: {
      type: String,
      default: '',
    },
    metadata: {
      receiptNumber: { type: String, default: '' },
      invoiceNumber: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
