const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: 2000
    },
    isRead: {
      type: Boolean,
      default: false
    },
    roomId: {
      type: String,
      required: [true, 'Room ID is required'],
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
