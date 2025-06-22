const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  status: { type: String, enum: ['online', 'idle', 'dnd', 'offline'], default: 'offline' },
  googleId: { type: String },
  facebookId: { type: String },
  appleId: { type: String },
  githubId: { type: String },
  microsoftId: { type: String },
});

const User = mongoose.model('User', userSchema);

module.exports = User; 