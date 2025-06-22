const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary } = require('../middleware/upload');
const Message = require('../models/Message');

// @route   POST api/upload
// @desc    Upload a file and get its URL
// @access  Private (should be protected)
router.post('/', upload.single('file'), uploadToCloudinary, async (req, res) => {
  if (!req.file || !req.file.cloudinaryUrl) {
    return res.status(400).json({ msg: 'File upload failed.' });
  }

  // Extract message data from request body
  const { sender, recipient, type } = req.body;
  
  try {
    // Create and save the message to database
    const newMessage = new Message({
      type: type || 'record',
      fileUrl: req.file.cloudinaryUrl,
      sender: sender,
      recipient: recipient || null,
    });

    await newMessage.save();

    // Emit the message via socket to all connected clients
    const io = req.app.get('io');
    if (io) {
      if (recipient) {
        // Private message - emit to specific recipient
        io.emit('receive_message', newMessage);
      } else {
        // Global message - emit to all
        io.emit('receive_message', newMessage);
      }
    }

    res.status(200).json({ fileUrl: req.file.cloudinaryUrl, message: newMessage });
  } catch (error) {
    console.error('Error saving message to database:', error);
    res.status(500).json({ msg: 'Error saving message' });
  }
});

module.exports = router; 