const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      maxlength: 2000
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    priceType: {
      type: String,
      enum: ['fixed', 'hourly', 'daily'],
      default: 'fixed'
    },
    serviceProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Service provider is required']
    },
    images: [{ type: String }],
    isAvailable: {
      type: Boolean,
      default: true
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    location: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ serviceProvider: 1 });
serviceSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Service', serviceSchema);
