const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { auth, isServiceProvider } = require('../middleware/auth');

// POST /api/services – create a new service (provider only)
router.post('/', auth, isServiceProvider, async (req, res) => {
  try {
    const { title, description, category, price, images, availability } = req.body;

    const service = await Service.create({
      serviceProvider: req.user.id,
      title,
      description,
      category,
      price,
      images: images || [],
      availability: availability || {},
    });

    return res.status(201).json({ service });
  } catch (err) {
    console.error('create service error:', err.message);
    return res.status(500).json({ error: 'Failed to create service' });
  }
});

// GET /api/services – list all active services (public)
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Service.countDocuments(filter);

    const services = await Service.find(filter)
      .populate('serviceProvider', 'name rating city profileImage')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      services,
      pagination: { total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)) },
    });
  } catch (err) {
    console.error('list services error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

// GET /api/services/:id – get a single service
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('serviceProvider', 'name rating city profileImage bio phone')
      .populate({ path: 'reviews', populate: { path: 'client', select: 'name profileImage' } });

    if (!service) return res.status(404).json({ error: 'Service not found' });

    return res.status(200).json({ service });
  } catch (err) {
    console.error('get service error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve service' });
  }
});

// PUT /api/services/:id – update (provider, owner only)
router.put('/:id', auth, isServiceProvider, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    if (service.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised to update this service' });
    }

    const allowed = ['title', 'description', 'category', 'price', 'images', 'availability', 'isActive'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) service[field] = req.body[field];
    });

    await service.save();
    return res.status(200).json({ service });
  } catch (err) {
    console.error('update service error:', err.message);
    return res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id – soft delete (provider, owner only)
router.delete('/:id', auth, isServiceProvider, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    if (service.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised to delete this service' });
    }

    service.isActive = false;
    await service.save();

    return res.status(200).json({ message: 'Service deleted' });
  } catch (err) {
    console.error('delete service error:', err.message);
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
