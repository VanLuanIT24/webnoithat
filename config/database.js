const mysql = require('mysql2/promise');

class MySQLDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      console.log('🔧 Initializing database connection...');
      console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
      console.log('DB_HOST:', process.env.DB_HOST || 'Not set');
      
      // Railway cung cấp DATABASE_URL
      if (process.env.DATABASE_URL) {
        // Parse DATABASE_URL để thêm SSL config
        const dbConfig = {
          uri: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          }
        };
        this.pool = mysql.createPool(process.env.DATABASE_URL);
        console.log('✅ Using DATABASE_URL for MySQL connection');
      } else {
        // Development config - sửa localhost thành 127.0.0.1 để tránh IPv6
        this.pool = mysql.createPool({
          host: process.env.DB_HOST || '127.0.0.1', // Sửa từ 'localhost' thành '127.0.0.1'
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '10042004',
          database: process.env.DB_NAME || 'webnoithat',
          port: process.env.DB_PORT || 3306,
          waitForConnections: true,
          connectionLimit: parseInt(process.env.DB_CONN_LIMIT || '10', 10),
          queueLimit: 0,
          charset: 'utf8mb4',
          timezone: process.env.DB_TIMEZONE || '+00:00',
          // Thêm socketPath cho MySQL local trên MacOS
          socketPath: process.env.DB_SOCKET_PATH || null
        });
        console.log('✅ Using individual DB env vars for MySQL connection');
      }

      // Test connection với retry logic
      await this.testConnection();
      this.isConnected = true;
      
    } catch (error) {
      console.error('❌ Lỗi kết nối MySQL:', error.message);
      
      // Trong production, không exit process ngay lập tức
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Application will continue without database connection');
        // Có thể thêm retry logic sau
      } else {
        console.log('💡 Development tip: Make sure MySQL is running on port 3306');
        console.log('💡 Run: brew services start mysql (MacOS)');
        console.log('💡 Or: sudo systemctl start mysql (Linux)');
        process.exit(1);
      }
    }
  }

  async testConnection(retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        const connection = await this.pool.getConnection();
        console.log('✅ Đã kết nối đến MySQL database');
        connection.release();
        return true;
      } catch (error) {
        console.log(`🔄 Retry ${i + 1}/${retries} - Database connection failed: ${error.message}`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  async query(sql, params = []) {
    // Nếu không có kết nối database, throw error rõ ràng
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }

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
      console.error('❌ Lỗi truy vấn MySQL:', error.message);
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

  // Health check
  async healthCheck() {
    try {
      await this.query('SELECT 1');
      return { status: 'healthy', database: 'connected' };
    } catch (error) {
      return { status: 'unhealthy', database: 'disconnected', error: error.message };
    }
  }
}

module.exports = new MySQLDatabase();