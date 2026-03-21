const express = require('express');
const Review = require('../models/Review');
const Service = require('../models/Service');
const { auth, isClient } = require('../middleware/auth');

const router = express.Router();

// Create Review (client only)
router.post('/', auth, isClient, async (req, res) => {
  try {
    const review = new Review({
      ...req.body,
      client: req.user.id
    });
    await review.save();

    // Add review reference to service and update rating incrementally
    const service = await Service.findById(review.service);
    if (service) {
      const previousCount = service.reviews.length;
      const previousRating = service.rating || 0;
      service.reviews.push(review._id);
      service.rating =
        (previousRating * previousCount + review.rating) / (previousCount + 1);
      await service.save();
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Reviews for a Service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const reviews = await Review.find({ service: req.params.serviceId }).populate(
      'client',
      'name profileImage'
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
