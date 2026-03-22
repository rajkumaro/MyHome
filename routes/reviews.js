const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { serviceId } = req.query;
    const filter = serviceId ? { service: serviceId } : {};
    const reviews = await Review.find(filter)
      .populate('client', 'name')
      .sort({ createdAt: -1 });
    return res.status(200).json({ reviews });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get reviews' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const review = await Review.create({ ...req.body, client: req.user.id });
    return res.status(201).json({ review });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create review' });
  }
});

module.exports = router;
