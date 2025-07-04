const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Optionally, check if user is soft deleted
    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      return res.status(401).json({ msg: 'User not found or deleted' });
    }
    req.user = { id: user._id };
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}; 