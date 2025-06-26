const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  discriminator: { type: String, required: true, default: '0001' },
  password: { type: String },
  email: { type: String, required: true, unique: true },
  secondaryEmails: { type: [String], default: [] },
  isVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  first_name: { type: String, default: '' },
  last_name: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  status: { type: String, enum: ['online', 'idle', 'dnd', 'offline'], default: 'offline' },
  googleId: { type: String },
  facebookId: { type: String },
  appleId: { type: String },
  githubId: { type: String },
  microsoftId: { type: String },
  phone: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.index({ username: 1, discriminator: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User; 