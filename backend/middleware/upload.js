const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (req, res, next) => {
  console.log('uploadToCloudinary called');
  console.log('req.file:', req.file);
  
  if (!req.file) {
    console.log('No file to upload');
    return next(); // No file to upload
  }

  console.log('Starting Cloudinary upload...');
  console.log('File buffer size:', req.file.buffer.length);
  console.log('File mimetype:', req.file.mimetype);

  const stream = cloudinary.uploader.upload_stream(
    { 
      folder: 'chat-app',
      resource_type: 'video' // This allows audio files to be uploaded
    }, 
    (error, result) => {
      console.log('Cloudinary callback - error:', error);
      console.log('Cloudinary callback - result:', result);
      
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ msg: 'Cloudinary upload error', error: error.message });
      }
      req.file.cloudinaryUrl = result.secure_url;
      console.log('Upload successful, URL:', result.secure_url);
      next();
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(stream);
};

module.exports = { upload, uploadToCloudinary }; 