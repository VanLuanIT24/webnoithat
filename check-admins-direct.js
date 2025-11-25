require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAdmins() {
  let connection;
  try {
    console.log('🔄 Đang kết nối Railway MySQL...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Kết nối thành công!\n');
    
    const [admins] = await connection.query('SELECT * FROM admins');
    
    console.log(`📊 Tổng số admin: ${admins.length}\n`);
    
    admins.forEach((admin, index) => {
      console.log(`👤 Admin ${index + 1}:`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Username: ${admin.userName}`);
      console.log(`   Họ tên: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Phone: ${admin.phoneNumber}`);
      console.log(`   Address: ${admin.address}`);
      console.log(`   Roles: ${admin.roles}`);
      console.log(`   Password (hashed): ${admin.password ? admin.password.substring(0, 20) + '...' : 'N/A'}`);
      console.log(`   Ngày tạo: ${admin.createdAt}`);
      console.log('');
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkAdmins();
