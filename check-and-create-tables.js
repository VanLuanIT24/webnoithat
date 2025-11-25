require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAndCreateTables() {
  let connection;
  try {
    console.log('🔄 Đang kết nối Railway MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Kết nối thành công!');
    
    // Kiểm tra các bảng hiện có
    console.log('\n📋 Kiểm tra các bảng hiện có...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Các bảng:', tables);
    
    if (tables.length === 0) {
      console.log('\n🔨 Chưa có bảng nào, bắt đầu tạo bảng...');
      
      // Tạo bảng admins
      console.log('📦 Tạo bảng admins...');
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
          status BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_username (userName),
          INDEX idx_mongoId (mongoId)
        )
      `);
      console.log('✅ Đã tạo bảng admins');
      
      // Tạo bảng types
      console.log('📦 Tạo bảng types...');
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
      console.log('✅ Đã tạo bảng types');
      
      // Tạo bảng suppliers
      console.log('📦 Tạo bảng suppliers...');
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
      console.log('✅ Đã tạo bảng suppliers');
      
      // Tạo bảng customers
      console.log('📦 Tạo bảng customers...');
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
      console.log('✅ Đã tạo bảng customers');
      
      // Tạo bảng products
      console.log('📦 Tạo bảng products...');
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
      console.log('✅ Đã tạo bảng products');
      
      // Tạo bảng bills
      console.log('📦 Tạo bảng bills...');
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
      console.log('✅ Đã tạo bảng bills');
      
      // Tạo bảng regions
      console.log('📦 Tạo bảng regions...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS regions (
          _id INT AUTO_INCREMENT PRIMARY KEY,
          mongoId VARCHAR(255),
          region VARCHAR(255) NOT NULL,
          details JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_mongoId (mongoId)
        )
      `);
      console.log('✅ Đã tạo bảng regions');
      
      console.log('\n🎉 Đã tạo tất cả các bảng thành công!');
    } else {
      console.log('✅ Database đã có bảng');
    }
    
    // Kiểm tra lại
    const [finalTables] = await connection.query('SHOW TABLES');
    console.log('\n📊 Tổng số bảng:', finalTables.length);
    finalTables.forEach(table => {
      console.log('   -', Object.values(table)[0]);
    });
    
    await connection.end();
    console.log('\n✅ Hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkAndCreateTables();
