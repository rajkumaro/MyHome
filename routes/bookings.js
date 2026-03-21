const express = require('express');
const Booking = require('../models/Booking');
const { auth, isClient } = require('../middleware/auth');

const router = express.Router();

// Create Booking (client only)
router.post('/', auth, isClient, async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      client: req.user.id
    });
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Bookings (client or service provider)
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ client: req.user.id }, { serviceProvider: req.user.id }]
    }).populate('service client serviceProvider', '-password');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Booking Status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner =
      booking.client.toString() === req.user.id ||
      booking.serviceProvider.toString() === req.user.id;

    if (!isOwner) return res.status(403).json({ message: 'Not authorized' });

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
