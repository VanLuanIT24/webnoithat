require("dotenv").config();
const mysql = require("mysql2/promise");

console.log("💾 Loading Database Config...");
console.log("🔍 ALL ENV variables:", Object.keys(process.env).filter(key => 
  key.includes('MYSQL') || key.includes('DB') || key.includes('DATABASE')
));

// Hỗ trợ nhiều format biến môi trường (Railway, Railway MySQL Plugin, Custom)
const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER || process.env.MYSQL_USER || 'root';
const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'railway';
const DB_PORT = process.env.MYSQLPORT || process.env.DB_PORT || process.env.MYSQL_PORT || 3306;

console.log("🔍 Database Config:", {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD ? '***' : 'undefined',
  database: DB_NAME,
  port: DB_PORT
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
