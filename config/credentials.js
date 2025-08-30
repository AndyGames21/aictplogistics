// Load environment variables
require("dotenv").config();

// Create DB Credentials
module.exports = {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  sessionSecret: process.env.SESSION_SECRET,
  port: process.env.PORT || 3000
};
