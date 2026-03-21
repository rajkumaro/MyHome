const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
