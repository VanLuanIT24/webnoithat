require('dotenv').config();
const mysql = require('mysql2/promise');

// Đọc config từ environment variables
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'webnoithat',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: process.env.DB_TIMEZONE || '+07:00'
};

console.log('📊 Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Tạo connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL connected successfully to', dbConfig.host);
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Host:', dbConfig.host);
    console.error('   Port:', dbConfig.port);
    console.error('   User:', dbConfig.user);
    console.error('   Database:', dbConfig.database);
  });

// Thêm helper methods
pool.insert = async function(tableName, data) {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    const [result] = await this.query(sql, values);
    return { _id: result.insertId, insertId: result.insertId };
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error.message);
    throw error;
  }
};

pool.update = async function(tableName, data, where, whereParams) {
  try {
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];
    const sql = `UPDATE ${tableName} SET ${updates} WHERE ${where}`;
    
    const [result] = await this.query(sql, values);
    return result;
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error.message);
    throw error;
  }
};

pool.delete = async function(tableName, where, whereParams) {
  try {
    const sql = `DELETE FROM ${tableName} WHERE ${where}`;
    const [result] = await this.query(sql, whereParams);
    return result;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error.message);
    throw error;
  }
};

module.exports = pool;