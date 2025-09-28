// config/db.js
const { Pool } = require("pg");
const creds = require("./credentials");

let pool;

if (creds.databaseUrl) {
  // Use DATABASE_URL
  pool = new Pool({
    connectionString: creds.databaseUrl,
    ssl:
      creds.nodeEnv === "production"
        ? { rejectUnauthorized: false }
        : false 
  });
} else {
  //Local environment using manual credentials
  pool = new Pool({
    host: creds.db.host,
    user: creds.db.user,
    password: creds.db.password,
    database: creds.db.database,
    port: creds.db.port
  });
}

module.exports = pool;