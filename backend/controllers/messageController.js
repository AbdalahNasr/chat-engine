const Message = require('../models/Message');

// Update a message (only by sender)
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const username = req.user.username;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ msg: 'Message not found' });
    if (message.sender !== username) return res.status(403).json({ msg: 'Not authorized' });
    message.text = text;
    await message.save();
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a message (only by sender)
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user.username;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ msg: 'Message not found' });
    if (message.sender !== username) return res.status(403).json({ msg: 'Not authorized' });
    await message.deleteOne();
    res.json({ msg: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get all messages (optionally filter by sender/recipient)
exports.getAllMessages = async (req, res) => {
  try {
    const filter = {};
    if (req.query.sender) filter.sender = req.query.sender;
    if (req.query.recipient) filter.recipient = req.query.recipient;
    const messages = await Message.find(filter).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get a single message by ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ msg: 'Message not found' });
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { type, text, fileUrl, sender, recipient } = req.body;
    const message = new Message({ type, text, fileUrl, sender, recipient });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 