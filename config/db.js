// config/db.js
const { Pool } = require("pg");
const creds = require("./credentials");

let pool;

if (creds.nodeEnv === "production" && creds.databaseUrl) {
  // Production environment — use DATABASE_URL with SSL
  pool = new Pool({
    connectionString: creds.databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Local environment 
  pool = new Pool({
    host: creds.db.host,
    user: creds.db.user,
    password: creds.db.password,
    database: creds.db.database,
    port: creds.db.port
  });
}

module.exports = pool;
