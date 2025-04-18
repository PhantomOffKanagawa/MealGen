const dotenv = require("dotenv");

// Load environment variables from .env file
const config = dotenv.config();

const mongodb_url =
  config.parsed.MONGODB_URL || "mongodb://localhost:27017/mydatabase";
const jwt_secret = config.parsed.JWT_SECRET || "your_jwt_secret";
const node_env = config.parsed.NODE_ENV || "development";
const frontend_url = config.parsed.FRONTEND_URL || "http://localhost:3000";
const port = config.parsed.BACKEND_PORT || 4000;

module.exports = {
  mongodb_url,
  jwt_secret,
  node_env,
  frontend_url,
  port,
};
