const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    stripePaymentMethodId: {
      type: String,
      required: [true, 'Stripe payment method ID is required'],
    },
    cardBrand: {
      type: String,
      lowercase: true,
      default: '',
    },
    last4Digits: {
      type: String,
      default: '',
    },
    expiryMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
    expiryYear: {
      type: Number,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    billingZip: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ userId: 1 });
paymentMethodSchema.index({ stripePaymentMethodId: 1 }, { unique: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
