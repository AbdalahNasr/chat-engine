const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const { avatarUpload, uploadAvatarToCloudinary } = require('../middleware/avatarUpload');
const jwt = require('jsonwebtoken');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', avatarUpload.single('avatar'), uploadAvatarToCloudinary, register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// Email verification
router.get('/verify-email', verifyEmail);
// Forgot password
router.post('/forgot-password', forgotPassword);
// Reset password
router.post('/reset-password', resetPassword);

// Social login routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
  const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const user = encodeURIComponent(JSON.stringify(req.user));
  res.redirect(`${process.env.FRONTEND_URL}/callback?user=${user}&token=${token}`);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login', session: false }), (req, res) => {
  const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const user = encodeURIComponent(JSON.stringify(req.user));
  res.redirect(`${process.env.FRONTEND_URL}/callback?user=${user}&token=${token}`);
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login', session: false }), (req, res) => {
  const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const user = encodeURIComponent(JSON.stringify(req.user));
  res.redirect(`${process.env.FRONTEND_URL}/callback?user=${user}&token=${token}`);
});

module.exports = router; 