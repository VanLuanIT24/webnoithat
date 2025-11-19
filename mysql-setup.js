// mysql-setup.js
const mysql = require('mysql2/promise');

async function setupDatabase() {
  let connection;
  try {
    // Kết nối tới MySQL (chưa chọn database)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '10042004'
    });

    console.log('Đang kết nối đến MySQL...');

    // Tạo database nếu chưa tồn tại - sử dụng query thay vì execute
    await connection.query('CREATE DATABASE IF NOT EXISTS webnoithat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // Đóng kết nối hiện tại và kết nối lại với database cụ thể
    await connection.end();
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '10042004',
      database: 'webnoithat'
    });

    console.log('✅ Database webnoithat đã được tạo/kiểm tra');

    // Tạo các bảng
    await createTables(connection);
    
    await connection.end();
    console.log('✅ Thiết lập database hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi thiết lập database:', error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

// Trong hàm createTables, sửa tất cả các bảng:
async function createTables(connection) {
  try {
    // Bảng types (danh mục) - THÊM trường mongoId
    await connection.query(`
      CREATE TABLE IF NOT EXISTS types (
        _id INT AUTO_INCREMENT PRIMARY KEY,
        mongoId VARCHAR(255),
        typeName VARCHAR(255) NOT NULL,
        thumbnail VARCHAR(500),
        status BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mongoId (mongoId)
      )
    `);

    // Bảng suppliers (nhà cung cấp) - THÊM trường mongoId
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        _id INT AUTO_INCREMENT PRIMARY KEY,
        mongoId VARCHAR(255),
        supplierName VARCHAR(255) NOT NULL,
        status BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mongoId (mongoId)
      )
    `);

    // Bảng customers (người dùng) - THÊM trường mongoId
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        _id INT AUTO_INCREMENT PRIMARY KEY,
        mongoId VARCHAR(255),
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        dateOfBirth VARCHAR(100),
        sex ENUM('male', 'female', 'other'),
        identityCardNumber VARCHAR(20),
        address TEXT,
        phoneNumber VARCHAR(20),
        email VARCHAR(255),
        avatar VARCHAR(500),
        userName VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        userType ENUM('User', 'Admin') DEFAULT 'User',
        roles JSON,
        status BOOLEAN DEFAULT TRUE,
        listProduct JSON,
        listFavorite JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (userName),
        INDEX idx_mongoId (mongoId)
      )
    `);

    // Bảng products (sản phẩm) - THÊM trường mongoId
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        _id INT AUTO_INCREMENT PRIMARY KEY,
        mongoId VARCHAR(255),
        productName VARCHAR(255) NOT NULL,
        description JSON,
        discount JSON,
        rating JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mongoId (mongoId)
      )
    `);

    // Bảng bills (hóa đơn) - THÊM trường mongoId
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bills (
        _id INT AUTO_INCREMENT PRIMARY KEY,
        mongoId VARCHAR(255),
        userID INT,
        userMongoId VARCHAR(255),
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        listProduct JSON,
        address TEXT,
        paymentMethod VARCHAR(100),
        resquest TEXT,
        status VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_mongoId (mongoId),
        INDEX idx_userMongoId (userMongoId)
      )
    `);

    // Bảng regions (khu vực) - THÊM trường mongoId
    await connection.query(`
      CREATE TABLE IF NOT EXISTS regions (
        _id INT AUTO_INCREMENT PRIMARY KEY,
        mongoId VARCHAR(255),
        Id VARCHAR(50),
        Name VARCHAR(255),
        Districts JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mongoId (mongoId)
      )
    `);

    // Bảng admins (quản trị viên) - THÊM trường mongoId
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        _id INT AUTO_INCREMENT PRIMARY KEY,
        mongoId VARCHAR(255),
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        dateOfBirth VARCHAR(100),
        sex ENUM('male', 'female', 'other'),
        identityCardNumber VARCHAR(20),
        address TEXT,
        phoneNumber VARCHAR(20),
        email VARCHAR(255),
        avatar VARCHAR(500),
        userName VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        userType ENUM('User', 'Admin') DEFAULT 'Admin',
        roles JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (userName),
        INDEX idx_mongoId (mongoId)
      )
    `);

    console.log('✅ Tất cả bảng đã được tạo với trường mongoId!');
  } catch (error) {
    console.error('❌ Lỗi tạo bảng:', error);
    throw error;
  }
}

module.exports = { setupDatabase };