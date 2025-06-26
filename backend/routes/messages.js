const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Get all messages (optionally filter by sender/recipient)
 *     parameters:
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by sender username
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by recipient username
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/', messageController.getAllMessages);

/**
 * @swagger
 * /messages/{id}:
 *   get:
 *     summary: Get a message by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message object
 *       404:
 *         description: Message not found
 */
router.get('/:id', messageController.getMessageById);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Create a new message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               text:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               sender:
 *                 type: string
 *               recipient:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message created
 */
router.post('/', requireAuth, messageController.createMessage);

/**
 * @swagger
 * /messages/{id}:
 *   put:
 *     summary: Update a message by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated
 *       404:
 *         description: Message not found
 */
router.put('/:id', requireAuth, messageController.updateMessage);

/**
 * @swagger
 * /messages/{id}:
 *   delete:
 *     summary: Delete a message by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 *       404:
 *         description: Message not found
 */
router.delete('/:id', requireAuth, messageController.deleteMessage);

module.exports = router; 