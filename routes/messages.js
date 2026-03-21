const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

// POST /api/messages – send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: 'receiverId and message are required' });
    }

    // Deterministic room ID: sort the two user IDs so both sides share the same room
    const ids = [req.user.id, receiverId].sort();
    const roomId = ids.join('_');

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      message,
      roomId,
    });

    const populated = await newMessage.populate([
      { path: 'sender', select: 'name profileImage' },
      { path: 'receiver', select: 'name profileImage' },
    ]);

    // Emit via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('receive_message', populated);
    }

    return res.status(201).json({ message: populated });
  } catch (err) {
    console.error('send message error:', err.message);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/:userId – get conversation with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const ids = [req.user.id, userId].sort();
    const roomId = ids.join('_');

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Message.countDocuments({ roomId });

    const messages = await Message.find({ roomId })
      .populate('sender', 'name profileImage')
      .populate('receiver', 'name profileImage')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Mark unread messages as read
    await Message.updateMany(
      { roomId, receiver: req.user.id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      messages,
      pagination: { total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)) },
    });
  } catch (err) {
    console.error('get messages error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

module.exports = router;
