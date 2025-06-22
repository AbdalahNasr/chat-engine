const User = require('../models/User');

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