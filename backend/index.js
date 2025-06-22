const express = require("express");
const cors = require("cors");
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require('./config/db');
const Message = require('./models/Message');
const User = require('./models/User');
const session = require('express-session');
const passport = require('passport');
const configurePassport = require('./config/passport');

// Load environment variables
require('dotenv').config();

// Check for required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error('🔴 FATAL ERROR: Missing required environment variables:');
  console.error(missingEnvVars.join(', '));
  console.error('Please create a .env file in the /backend directory and add these variables.');
  process.exit(1); // Exit the process with an error code
}

// Debug environment variables
console.log('Environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json());

// Determine BASE_URL
const BASE_URL = process.env.BASE_URL || `http://localhost:3001`;

// CORS setup: allow local and deployed frontend
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost port
    if (allowedOrigins.some(pattern => (typeof pattern === 'string' ? pattern === origin : pattern.test(origin)))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"]
  }
});

// Make io available to routes
app.set('io', io);

// Keep track of online users: { username: socketId }
const onlineUsers = {};

// Helper function to update and broadcast status
const updateUserStatus = async (username, status) => {
  try {
    const user = await User.findOneAndUpdate(
      { username }, 
      { status }, 
      { new: true }
    );
    if (user) {
      io.emit('status_changed', { username, status: user.status });
    }
  } catch (error) {
    console.error(`Failed to update status for ${username}:`, error);
  }
};

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('user_online', (username) => {
    onlineUsers[username] = socket.id;
    updateUserStatus(username, 'online');
  });

  socket.on('change_status', ({ username, status }) => {
    // Basic validation
    if (['online', 'idle', 'dnd', 'offline'].includes(status)) {
      updateUserStatus(username, status);
    }
  });

  // --- HISTORY LOGIC ---
  // Send GLOBAL message history on initial connect
  try {
    const messages = await Message.find({ recipient: null }).sort({ timestamp: 1 });
    socket.emit('chat_history', { messages, isGlobal: true });
  } catch (err) {
    console.error('Error fetching global messages from DB:', err);
  }

  // Listen for a request for a specific chat's history
  socket.on('get_chat_history', async ({ currentUser, otherUser, isGlobal }) => {
    try {
      if(isGlobal) {
        const messages = await Message.find({ recipient: null }).sort({ timestamp: 1 });
        socket.emit('chat_history', { messages, isGlobal: true });
        return;
      }

      const messages = await Message.find({
        $or: [
          { sender: currentUser, recipient: otherUser },
          { sender: otherUser, recipient: currentUser },
        ],
      }).sort({ timestamp: 1 });
      socket.emit('chat_history', { messages, user: otherUser });
    } catch (err) {
      console.error('Error fetching private messages from DB:', err);
    }
  });

  // --- TYPING INDICATOR LOGIC ---
  socket.on('typing_start', (data) => {
    const { username, recipient, isGlobal } = data;
    
    if (isGlobal) {
      // Broadcast to all users except the sender
      socket.broadcast.emit('user_typing', { username, isGlobal: true });
    } else {
      // For private messages, send to the specific recipient
      const recipientSocketId = onlineUsers[recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_typing', { 
          username, 
          isGlobal: false, 
          recipient
        });
      }
    }
  });

  socket.on('typing_stop', (data) => {
    const { username, recipient, isGlobal } = data;
    
    if (isGlobal) {
      // Broadcast to all users except the sender
      socket.broadcast.emit('user_stopped_typing', { username });
    } else {
      // For private messages, send to the specific recipient
      const recipientSocketId = onlineUsers[recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_stopped_typing', { username });
      }
    }
  });

  // --- SENDING MESSAGE LOGIC ---
  socket.on('send_message', async (data) => {
    const { text, sender, recipient, type, fileUrl } = data;
    
    const messageData = {
      sender,
      recipient,
      type: type || 'text'
    };
    
    if (type === 'text' || !type) {
      messageData.text = text;
    } else {
      messageData.fileUrl = fileUrl;
    }
    
    const newMessage = new Message(messageData);
    
    try {
      await newMessage.save();

      if (recipient) { // Private Message
        const recipientSocketId = onlineUsers[recipient];
        if (recipientSocketId) {
          // Send to the recipient
          io.to(recipientSocketId).emit('receive_message', newMessage);
        }
        // Send back to the sender
        socket.emit('receive_message', newMessage);
      } else { // Global Message
        io.emit('receive_message', newMessage);
      }
    } catch (err) {
      console.error('Error saving message to DB:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Find which user disconnected and remove them
    for (const username in onlineUsers) {
      if (onlineUsers[username] === socket.id) {
        delete onlineUsers[username];
        updateUserStatus(username, 'offline');
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on ${BASE_URL}`);
});