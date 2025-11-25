require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearAdmins() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    await connection.query('DELETE FROM admins');
    console.log('✅ Đã xóa tất cả admin cũ');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (connection) await connection.end();
  }
}

clearAdmins();
