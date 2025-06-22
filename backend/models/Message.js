const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'pdf', 'record'],
    default: 'text',
  },
  text: {
    type: String,
    required: function() { return this.type === 'text'; },
  },
  fileUrl: {
    type: String,
    required: function() { return this.type !== 'text'; },
  },
  sender: {
    type: String,
    required: true,
  },
  recipient: {
    type: String, // This will be null for global messages
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', MessageSchema); 