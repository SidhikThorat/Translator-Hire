const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_APL_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    timeout: 60000 // 60 seconds timeout
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'translator-hire',
        allowed_formats: ['jpeg', 'png', 'jpg', 'mp4', 'mov', 'avi'],
        resource_type: 'auto',
        max_file_size: 10485760, // 10MB limit
        max_video_duration: 120 // 2 minutes limit
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10485760 // 10MB limit
    }
});

module.exports = {
    cloudinary,
    upload
}; 