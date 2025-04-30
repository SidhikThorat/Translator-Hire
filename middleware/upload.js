const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
    // Accept images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    // Accept videos
    else if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    }
    // Reject other file types
    else {
        cb(new Error('Only images and videos are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    }
});

module.exports = upload; 