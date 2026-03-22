const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter =
      req.user.role === 'serviceProvider'
        ? { serviceProvider: req.user.id }
        : { client: req.user.id };

    const bookings = await Booking.find(filter)
      .populate('service', 'title price')
      .populate('client', 'name email')
      .populate('serviceProvider', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get bookings' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const booking = await Booking.create({ ...req.body, client: req.user.id });
    return res.status(201).json({ booking });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create booking' });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    return res.status(200).json({ booking });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update booking status' });
  }
});

module.exports = router;
