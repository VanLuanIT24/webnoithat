// config/database.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  queueLimit: 0,
  charset: 'utf8mb4'
};

console.log("🔍 Using DB:", dbConfig.host, dbConfig.port);

const pool = mysql.createPool(dbConfig);

module.exports = pool;
