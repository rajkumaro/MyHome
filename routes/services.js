const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { auth, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';

    const services = await Service.find(filter).populate('serviceProvider', 'name email');
    return res.status(200).json({ services });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get services' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('serviceProvider', 'name email');
    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.status(200).json({ service });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get service' });
  }
});

router.post('/', auth, authorize('serviceProvider', 'admin'), async (req, res) => {
  try {
    const service = await Service.create({ ...req.body, serviceProvider: req.user.id });
    return res.status(201).json({ service });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create service' });
  }
});

router.put('/:id', auth, authorize('serviceProvider', 'admin'), async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, serviceProvider: req.user.id },
      req.body,
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.status(200).json({ service });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update service' });
  }
});

router.delete('/:id', auth, authorize('serviceProvider', 'admin'), async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      serviceProvider: req.user.id
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.status(200).json({ message: 'Service deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete service' });
  }
});

module.exports = router;
