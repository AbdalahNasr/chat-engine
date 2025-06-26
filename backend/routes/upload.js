const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary } = require('../middleware/upload');
const Message = require('../models/Message');

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file and get its URL
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               sender:
 *                 type: string
 *               recipient:
 *                 type: string
 *               type:
 *                 type: string
 *                 description: File type (e.g., 'record')
 *     responses:
 *       200:
 *         description: File uploaded and message created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileUrl:
 *                   type: string
 *                 message:
 *                   type: object
 */
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