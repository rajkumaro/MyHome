const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    stripePaymentMethodId: {
      type: String,
      required: [true, 'Stripe payment method ID is required'],
      unique: true
    },
    cardBrand: {
      type: String,
      lowercase: true,
      default: 'unknown'
    },
    last4: {
      type: String,
      required: [true, 'Last 4 digits are required'],
      minlength: 4,
      maxlength: 4
    },
    expiryMonth: {
      type: Number,
      required: [true, 'Expiry month is required'],
      min: 1,
      max: 12
    },
    expiryYear: {
      type: Number,
      required: [true, 'Expiry year is required'],
      min: new Date().getFullYear() - 1
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    billingZip: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

paymentMethodSchema.index({ userId: 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
