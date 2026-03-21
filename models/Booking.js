const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client is required'],
    },
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Service provider is required'],
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ serviceProvider: 1, status: 1 });
bookingSchema.index({ service: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
