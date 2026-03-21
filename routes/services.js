const express = require('express');
const Service = require('../models/Service');
const { auth, isServiceProvider } = require('../middleware/auth');

const router = express.Router();

// Create Service (service provider only)
router.post('/', auth, isServiceProvider, async (req, res) => {
  try {
    const service = new Service({
      ...req.body,
      serviceProvider: req.user.id
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Services (with pagination and filtering)
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) query.category = category;

    const services = await Service.find(query)
      .populate('serviceProvider', '-password')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Service.countDocuments(query);

    res.json({ services, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('serviceProvider', '-password')
      .populate({ path: 'reviews', populate: { path: 'client', select: 'name profileImage' } });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
