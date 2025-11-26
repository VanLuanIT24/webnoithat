require("dotenv").config();
const mysql = require("mysql2/promise");

// Hỗ trợ cả 2 format biến môi trường
const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST;
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER;
const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME;
const DB_PORT = process.env.MYSQLPORT || process.env.DB_PORT || 3306;

console.log("💾 Loading Database Config...");
console.log("🔍 ENV variables received:", {
  MYSQLHOST: DB_HOST,
  MYSQLUSER: DB_USER,
  MYSQLPASSWORD: DB_PASSWORD ? '***' : 'undefined',
  MYSQLDATABASE: DB_NAME,
  MYSQLPORT: DB_PORT
});

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  queueLimit: 0,
});

module.exports = pool;
