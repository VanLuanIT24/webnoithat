require("dotenv").config();
const mysql = require("mysql2/promise");

console.log("💾 Loading Database Config...");

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Debug log để kiểm tra
console.log("🔍 DB CONFIG:", {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD?.substring(0, 4) + "****",
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
});

module.exports = pool;
