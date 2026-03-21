const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { auth, isClient } = require('../middleware/auth');

// POST /api/reviews – submit a review (client only)
router.post('/', auth, isClient, async (req, res) => {
  try {
    const { serviceId, rating, comment } = req.body;

    if (!serviceId || !rating) {
      return res.status(400).json({ error: 'serviceId and rating are required' });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Verify the client has a completed booking for this service
    const booking = await Booking.findOne({
      service: serviceId,
      client: req.user.id,
      status: 'completed',
    });

    if (!booking) {
      return res.status(403).json({ error: 'You can only review services you have completed' });
    }

    const review = await Review.create({
      service: serviceId,
      client: req.user.id,
      serviceProvider: service.serviceProvider,
      rating,
      comment: comment || '',
    });

    // Add review reference to service and recalculate rating
    service.reviews.push(review._id);
    const allReviews = await Review.find({ service: serviceId });
    service.rating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await service.save();

    return res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this service' });
    }
    console.error('create review error:', err.message);
    return res.status(500).json({ error: 'Failed to create review' });
  }
});

// GET /api/reviews/service/:serviceId – list reviews for a service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Review.countDocuments({ service: req.params.serviceId });

    const reviews = await Review.find({ service: req.params.serviceId })
      .populate('client', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      reviews,
      pagination: { total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)) },
    });
  } catch (err) {
    console.error('list reviews error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

module.exports = router;
