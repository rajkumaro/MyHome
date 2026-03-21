const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { auth, isClient, isServiceProvider } = require('../middleware/auth');

// POST /api/bookings – create a booking (client only)
router.post('/', auth, isClient, async (req, res) => {
  try {
    const { serviceId, bookingDate, notes } = req.body;

    const service = await Service.findById(serviceId).populate('serviceProvider');
    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const booking = await Booking.create({
      service: serviceId,
      client: req.user.id,
      serviceProvider: service.serviceProvider._id,
      bookingDate: new Date(bookingDate),
      totalPrice: service.price,
      notes: notes || '',
    });

    return res.status(201).json({ booking });
  } catch (err) {
    console.error('create booking error:', err.message);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings – list bookings for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter =
      req.user.userType === 'client'
        ? { client: req.user.id }
        : { serviceProvider: req.user.id };

    if (status) filter.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .populate('service', 'title category price images')
      .populate('client', 'name email phone profileImage')
      .populate('serviceProvider', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      bookings,
      pagination: { total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)) },
    });
  } catch (err) {
    console.error('list bookings error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

// GET /api/bookings/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title category price images description')
      .populate('client', 'name email phone profileImage')
      .populate('serviceProvider', 'name email phone profileImage bio');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const userId = req.user.id;
    if (
      booking.client._id.toString() !== userId &&
      booking.serviceProvider._id.toString() !== userId
    ) {
      return res.status(403).json({ error: 'Not authorised to view this booking' });
    }

    return res.status(200).json({ booking });
  } catch (err) {
    console.error('get booking error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

// PUT /api/bookings/:id/status – update booking status (provider only)
router.put('/:id/status', auth, isServiceProvider, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.serviceProvider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised to update this booking' });
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({ booking });
  } catch (err) {
    console.error('update booking status error:', err.message);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
});

module.exports = router;
