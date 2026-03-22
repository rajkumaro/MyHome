const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

router.get('/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    return res.status(200).json({ messages });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get messages' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const message = await Message.create({ ...req.body, sender: req.user.id });
    return res.status(201).json({ message });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send message' });
  }
});

module.exports = router;
