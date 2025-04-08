const dotenv = require('dotenv');

// Load environment variables from .env file
const config = dotenv.config();

const mongodb_url = config.parsed.MONGODB_URL || 'mongodb://localhost:27017/mydatabase';
const jwt_secret = config.parsed.JWT_SECRET || 'your_jwt_secret';

module.exports = {
    mongodb_url,
    jwt_secret,
};