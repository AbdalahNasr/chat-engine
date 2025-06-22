const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { avatarUpload, uploadAvatarToCloudinary } = require('../middleware/avatarUpload');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', avatarUpload.single('avatar'), uploadAvatarToCloudinary, register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

module.exports = router; 