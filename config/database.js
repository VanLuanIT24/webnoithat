require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT || '10', 10),
  queueLimit: 0
};

console.log("🔍 MySQL Config Loaded:", dbConfig);

const pool = mysql.createPool(dbConfig);

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully!");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
})();

module.exports = pool;
