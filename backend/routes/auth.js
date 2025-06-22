const express = require('express');
const router = express.Router();
const passport = require('passport');
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

// Social login routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
  res.send('Google login successful!');
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login', session: false }), (req, res) => {
  res.send('Facebook login successful!');
});

router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', passport.authenticate('apple', { failureRedirect: '/login', session: false }), (req, res) => {
  res.send('Apple login successful!');
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login', session: false }), (req, res) => {
  res.send('GitHub login successful!');
});

router.get('/microsoft', passport.authenticate('azuread-openidconnect', { scope: ['profile', 'email', 'openid'] }));
router.get('/microsoft/callback', passport.authenticate('azuread-openidconnect', { failureRedirect: '/login', session: false }), (req, res) => {
  res.send('Microsoft login successful!');
});

module.exports = router; 