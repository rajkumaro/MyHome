const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

reviewSchema.index({ service: 1 });
reviewSchema.index({ client: 1, service: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
