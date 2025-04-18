const dotenv = require("dotenv");

// Load environment variables from .env file
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const mongodb_url =
  process.env.MONGODB_URL || "mongodb://localhost:27017/mydatabase";
const jwt_secret = process.env.JWT_SECRET || "your_jwt_secret";
const node_env = process.env.NODE_ENV || "development";
const frontend_url = process.env.FRONTEND_URL || "http://localhost:3000";
const port = process.env.BACKEND_PORT || 4000;

module.exports = {
  mongodb_url,
  jwt_secret,
  node_env,
  frontend_url,
  port,
};
