const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    // Find all users, but exclude the password field from the result
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes authentication middleware sets req.user
    const updateFields = {};
    const allowedFields = ['first_name', 'last_name', 'profileImage', 'phone', 'secondaryEmail', 'username'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });
    // Handle email promotion/deletion
    if (req.body.promoteSecondary) {
      updateFields.email = req.user.secondaryEmail;
      updateFields.secondaryEmail = '';
    }
    if (req.body.deleteEmail) {
      if (req.user.secondaryEmail) {
        updateFields.email = req.user.secondaryEmail;
        updateFields.secondaryEmail = '';
      } else {
        return res.status(400).json({ msg: 'Set a secondary email before deleting the primary.' });
      }
    }
    // If avatar was uploaded, use the URL from Cloudinary
    if (req.body.profileImage) {
      console.log('updateProfile: profileImage to save =', req.body.profileImage);
      updateFields.profileImage = req.body.profileImage;
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');
    if (!updatedUser) return res.status(404).json({ msg: 'User not found' });
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Soft delete user account
exports.softDeleteAccount = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes authentication middleware sets req.user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'Account deleted (soft delete).' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get current user's profile
exports.getMe = async (req, res) => {
  try {
    console.log('getMe: Looking up user with id:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');
    console.log('getMe: User found:', user);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Add a secondary email
exports.addSecondaryEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.secondaryEmails.includes(email)) {
      return res.status(400).json({ msg: 'Email already added as secondary' });
    }
    user.secondaryEmails.push(email);
    await user.save();
    console.log('addSecondaryEmail: Added', email, 'to', user.secondaryEmails);
    res.json({ secondaryEmails: user.secondaryEmails });
  } catch (err) {
    console.error('addSecondaryEmail error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Remove a secondary email
exports.removeSecondaryEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.secondaryEmails = user.secondaryEmails.filter(e => e !== email);
    await user.save();
    console.log('removeSecondaryEmail: Removed', email, 'from', user.secondaryEmails);
    res.json({ secondaryEmails: user.secondaryEmails });
  } catch (err) {
    console.error('removeSecondaryEmail error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Promote a secondary email to primary
exports.promoteSecondaryEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (!user.secondaryEmails.includes(email)) {
      return res.status(400).json({ msg: 'Email not found in secondary emails' });
    }
    // Move current primary to secondary
    user.secondaryEmails = user.secondaryEmails.filter(e => e !== email);
    user.secondaryEmails.push(user.email);
    user.email = email;
    await user.save();
    console.log('promoteSecondaryEmail: Promoted', email, 'to primary. New secondaryEmails:', user.secondaryEmails);
    res.json(user);
  } catch (err) {
    console.error('promoteSecondaryEmail error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Current and new password are required.' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'New password must be at least 6 characters.' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    console.log('changePassword: Password updated for user', user.username);
    res.json({ msg: 'Password changed successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}; 