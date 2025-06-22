const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Cloudinary is already configured in the main upload middleware, but it's safe to have it here too.
// Ensure your environment variables are set.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer for in-memory storage
const storage = multer.memoryStorage();
const avatarUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.', 400), false);
    }
  },
});

const uploadAvatarToCloudinary = (req, res, next) => {
  if (!req.file) {
    return next(); // No file to upload, proceed to the next middleware
  }

  const stream = cloudinary.uploader.upload_stream(
    { 
      folder: 'chat-app-avatars',
      transformation: [
        { width: 150, height: 150, crop: 'fill', gravity: 'face' },
      ]
    }, 
    (error, result) => {
      if (error) {
        console.error('Cloudinary avatar upload error:', error);
        return res.status(500).json({ msg: 'Cloudinary upload error', error: error.message });
      }
      // Attach the URL to the request object to be used in the controller
      req.body.profileImage = result.secure_url;
      next();
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(stream);
};

module.exports = { avatarUpload, uploadAvatarToCloudinary }; 