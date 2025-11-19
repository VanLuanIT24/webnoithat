// config/database.js
const mysql = require('mysql2/promise');

class MySQLDatabase {
  constructor() {
    this.pool = null;
    this.init();
  }

  async init() {
    try {
      // Railway thường cung cấp biến môi trường riêng hoặc một DATABASE_URL
      if (process.env.DATABASE_URL) {
        // MySQL connection string supported by mysql2: mysql://user:pass@host:port/db
        this.pool = mysql.createPool(process.env.DATABASE_URL);
        console.log('Using DATABASE_URL for MySQL connection');
      } else {
        this.pool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '10042004',
          database: process.env.DB_NAME || 'webnoithat',
          waitForConnections: true,
          connectionLimit: parseInt(process.env.DB_CONN_LIMIT || '10', 10),
          queueLimit: 0,
          charset: 'utf8mb4',
          timezone: process.env.DB_TIMEZONE || '+00:00'
        });
        console.log('Using individual DB_* env vars for MySQL connection');
      }

      // Test connection
      const connection = await this.pool.getConnection();
      console.log('✅ Đã kết nối đến MySQL database');
      connection.release();
    } catch (error) {
      console.error('❌ Lỗi kết nối MySQL:', error);
      process.exit(1);
    }
  }

  async query(sql, params = []) {
    try {
      // Sử dụng query thay vì execute cho các câu lệnh không phải prepared statement
      if (sql.includes('USE ') || sql.includes('CREATE ') || sql.includes('ALTER ') || sql.includes('DROP ')) {
        const [rows] = await this.pool.query(sql, params);
        return rows;
      } else {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
      }
    } catch (error) {
      console.error('Lỗi truy vấn MySQL:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  async findOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    return { insertedId: result.insertId };
  }

  async update(table, data, where, params = []) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...params];
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await this.query(sql, values);
    return { affectedRows: result.affectedRows };
  }

  async delete(table, where, params = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.query(sql, params);
    return { deletedCount: result.affectedRows };
  }

  // Transaction support
  async beginTransaction() {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  async commitTransaction(connection) {
    await connection.commit();
    connection.release();
  }

  async rollbackTransaction(connection) {
    await connection.rollback();
    connection.release();
  }
}

module.exports = new MySQLDatabase();