require('dotenv').config({ path: './.env' });
const cloudinary = require('cloudinary').v2;

// Log the current working directory and .env file path
console.log('Current working directory:', process.cwd());
console.log('Loading .env from:', require('path').resolve('./.env'));

// Log all environment variables (excluding sensitive ones)
console.log('Environment variables loaded:', Object.keys(process.env).filter(key => 
    !key.includes('SECRET') && !key.includes('KEY') && !key.includes('PASSWORD')
));

// Detailed Cloudinary configuration logging
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('\nCloudinary Configuration:');
console.log('Cloud Name:', cloudName || 'undefined');
console.log('API Key:', apiKey ? 'Present' : 'Missing');
console.log('API Secret:', apiSecret ? 'Present' : 'Missing');

if (!cloudName || !apiKey || !apiSecret) {
    console.error('\nError: Missing required Cloudinary configuration');
    console.error('Please check your .env file and ensure all required variables are set:');
    console.error('CLOUDINARY_CLOUD_NAME');
    console.error('CLOUDINARY_API_KEY');
    console.error('CLOUDINARY_API_SECRET');
    process.exit(1);
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

// Test the configuration
cloudinary.api.ping()
    .then(result => console.log('\nCloudinary connection test successful:', result))
    .catch(err => {
        console.error('\nCloudinary connection test failed:', err);
        process.exit(1);
    });

module.exports = cloudinary; 