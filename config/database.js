require("dotenv").config();

console.log("💾 Loading Database Config...");
console.log("🔍 Checking ENV variables...");

// Debug: Log tất cả biến môi trường liên quan đến DB
const relevantEnvVars = {};
Object.keys(process.env).forEach(key => {
  if (key.includes('MYSQL') || key.includes('DB') || key.includes('DATABASE')) {
    relevantEnvVars[key] = process.env[key] ? '***' : 'undefined';
  }
});
console.log("🔍 Relevant ENV variables:", relevantEnvVars);

// Hỗ trợ nhiều format biến môi trường
const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER || process.env.MYSQL_USER || 'root';
const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'railway';
const DB_PORT = process.env.MYSQLPORT || process.env.DB_PORT || process.env.MYSQL_PORT || 3306;

console.log("🔍 Final Database Config:", {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD ? '***' : 'undefined',
  database: DB_NAME,
  port: DB_PORT
});

// Kiểm tra xem có thiếu thông tin kết nối không
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('❌ Missing database connection parameters!');
  console.error('Required: host, user, password, database');
}

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Test connection function
pool.testConnection = async function() {
  try {
    const connection = await this.getConnection();
    console.log('✅ Database connection test successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

module.exports = pool;