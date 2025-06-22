const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');

// @route   GET api/users
// @desc    Get all users
// @access  Private (should be protected in a real app)
router.get('/', getAllUsers);

module.exports = router; 