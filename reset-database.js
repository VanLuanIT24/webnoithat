// reset-database.js
const mysql = require('mysql2/promise');

async function resetDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '10042004'
    });

    console.log('🗑️ Đang xóa database cũ...');
    await connection.query('DROP DATABASE IF EXISTS webnoithat');
    console.log('✅ Đã xóa database cũ');

    await connection.query('CREATE DATABASE webnoithat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Đã tạo database mới');

    await connection.end();
    console.log('🎉 Reset database hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi reset database:', error);
    if (connection) await connection.end();
  }
}

resetDatabase();