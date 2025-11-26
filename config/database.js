// Chỉ require dotenv khi development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const mysql = require("mysql2/promise");

console.log("💾 Loading Database Config...");

// TRỰC TIẾP sử dụng giá trị từ Railway MySQL service
const DB_CONFIG = {
  host: process.env.MYSQLHOST || 'switchback.proxy.rlwy.net',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'YeakDPlKQyydaJjcmShgqHXyXoYOAmaS',
  database: process.env.MYSQLDATABASE || 'railway',
  port: parseInt(process.env.MYSQLPORT || '28295'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT || '10'),
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

console.log("🔍 Database Config:", {
  host: DB_CONFIG.host,
  user: DB_CONFIG.user,
  password: DB_CONFIG.password ? '***' : 'NOT SET',
  database: DB_CONFIG.database,
  port: DB_CONFIG.port
});

const pool = mysql.createPool(DB_CONFIG);

module.exports = pool;