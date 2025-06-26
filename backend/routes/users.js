const express = require('express');
const router = express.Router();
const { getAllUsers, updateProfile, softDeleteAccount, getMe, addSecondaryEmail, removeSecondaryEmail, promoteSecondaryEmail, changePassword } = require('../controllers/userController');
const requireAuth = require('../middleware/auth');
const { updateMessage, deleteMessage } = require('../controllers/messageController');
const { avatarUpload, uploadAvatarToCloudinary } = require('../middleware/avatarUpload');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (excluding passwords)
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   profileImage:
 *                     type: string
 *                   isVerified:
 *                     type: boolean
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', requireAuth, updateProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Soft delete (deactivate) current user
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/me', requireAuth, softDeleteAccount);

// Update a message
router.put('/messages/:id', requireAuth, updateMessage);

// Delete a message
router.delete('/messages/:id', requireAuth, deleteMessage);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     responses:
 *       200:
 *         description: Current user profile
 */
router.get('/me', requireAuth, getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update current user's profile (RESTful)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me', requireAuth, avatarUpload.single('avatar'), uploadAvatarToCloudinary, updateProfile);

// Add a secondary email
router.post('/me/secondary-email', requireAuth, addSecondaryEmail);

// Remove a secondary email
router.delete('/me/secondary-email', requireAuth, removeSecondaryEmail);

// Promote a secondary email to primary
router.put('/me/promote-email', requireAuth, promoteSecondaryEmail);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put('/change-password', requireAuth, changePassword);

/**
 * @swagger
 * /users/logout:
 *   get:
 *     summary: Log out the current user (clears session)
 *     responses:
 *       200:
 *         description: Logged out
 */
router.get('/logout', (req, res) => {
  req.logout?.();
  req.session?.destroy?.(() => {});
  res.json({ msg: 'Logged out' });
});

module.exports = router; 