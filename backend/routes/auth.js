const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, verifyEmail, forgotPassword, resetPassword, verifyResetCode } = require('../controllers/authController');
const { avatarUpload, uploadAvatarToCloudinary } = require('../middleware/avatarUpload');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', avatarUpload.single('avatar'), uploadAvatarToCloudinary, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user & get token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset code sent
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     summary: Verify OTP code and get a temporary token for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Temporary token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tempToken:
 *                   type: string
 */
router.post('/verify-reset-code', verifyResetCode);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using temporary token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tempToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', resetPassword);

// Social login routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
  console.log('Google callback hit');
  let userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
  delete userObj.password;
  delete userObj.__v;
  const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const user = encodeURIComponent(JSON.stringify(userObj));
  const redirectUrl = `${process.env.FRONTEND_URL}/callback?user=${user}&token=${token}`;
  console.log('Redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login', session: false }), (req, res) => {
  console.log('Facebook callback hit');
  let userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
  delete userObj.password;
  delete userObj.__v;
  const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const user = encodeURIComponent(JSON.stringify(userObj));
  const redirectUrl = `${process.env.FRONTEND_URL}/callback?user=${user}&token=${token}`;
  console.log('Redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login', session: false }), (req, res) => {
  console.log('GitHub callback hit');
  let userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
  delete userObj.password;
  delete userObj.__v;
  const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const user = encodeURIComponent(JSON.stringify(userObj));
  const redirectUrl = `${process.env.FRONTEND_URL}/callback?user=${user}&token=${token}`;
  console.log('Redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

module.exports = router; 