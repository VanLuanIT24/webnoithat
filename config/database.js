// Chỉ require dotenv khi development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const mysql = require("mysql2/promise");

console.log("💾 Loading Database Config...");

// SỬ DỤNG TRỰC TIẾP process.env - KHÔNG fallback để debug
const DB_CONFIG = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER, 
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: parseInt(process.env.MYSQLPORT || '3306'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT || '10'),
  queueLimit: 0,
  connectTimeout: 60000,
};

console.log("🔍 Database Config:", {
  host: DB_CONFIG.host || 'NOT SET',
  user: DB_CONFIG.user || 'NOT SET', 
  password: DB_CONFIG.password ? '***' : 'NOT SET',
  database: DB_CONFIG.database || 'NOT SET',
  port: DB_CONFIG.port
});

// Kiểm tra config
if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password || !DB_CONFIG.database) {
  console.error('❌ MISSING DATABASE CONFIGURATION!');
  console.error('Required environment variables:');
  console.error('- MYSQLHOST:', process.env.MYSQLHOST || 'NOT SET');
  console.error('- MYSQLUSER:', process.env.MYSQLUSER || 'NOT SET');
  console.error('- MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '***' : 'NOT SET');
  console.error('- MYSQLDATABASE:', process.env.MYSQLDATABASE || 'NOT SET');
  console.error('- MYSQLPORT:', process.env.MYSQLPORT || 'NOT SET');
}

const pool = mysql.createPool(DB_CONFIG);

module.exports = pool;