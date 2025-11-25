require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Cấu hình database từ .env
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway'
};

// Đọc file JSON
function readAdminsJSON() {
  try {
    const filePath = path.join(__dirname, 'Database', 'Admins.json');
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File Admins.json không tồn tại tại: ${filePath}`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Lỗi đọc file Admins.json:`, error.message);
    return [];
  }
}

async function importAdmins() {
  let connection;
  
  try {
    console.log('🔄 Bắt đầu import admin từ JSON...\n');
    
    // Kết nối database
    console.log('📡 Đang kết nối Railway MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Kết nối thành công!\n');
    
    // Đọc dữ liệu từ JSON
    const adminsData = readAdminsJSON();
    
    if (adminsData.length === 0) {
      console.log('❌ Không có dữ liệu admin để import');
      await connection.end();
      process.exit(0);
    }
    
    console.log(`📦 Tìm thấy ${adminsData.length} admin trong file JSON\n`);
    
    // Xóa dữ liệu cũ (tùy chọn - comment dòng này nếu muốn giữ admin cũ)
    // await connection.query('DELETE FROM admins');
    // console.log('🗑️ Đã xóa dữ liệu admin cũ\n');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Import từng admin
    for (const adminData of adminsData) {
      try {
        const userName = adminData.loginInformation?.userName;
        const password = adminData.loginInformation?.password;
        
        if (!userName || !password) {
          console.log(`⚠️ Bỏ qua admin thiếu thông tin đăng nhập`);
          skipCount++;
          continue;
        }
        
        // Kiểm tra xem admin đã tồn tại chưa
        const [existing] = await connection.query(
          'SELECT _id FROM admins WHERE userName = ?',
          [userName]
        );
        
        if (existing.length > 0) {
          console.log(`⏭️ Admin "${userName}" đã tồn tại - bỏ qua`);
          skipCount++;
          continue;
        }
        
        // Không mã hóa mật khẩu - lưu trực tiếp
        let hashedPassword = password;
        console.log(`📝 Lưu mật khẩu gốc cho "${userName}": ${password}`);
        
        // Chuẩn bị dữ liệu insert
        const insertData = {
          mongoId: adminData._id?.$oid || adminData._id,
          firstName: adminData.fullNameCustomer?.firstName || '',
          lastName: adminData.fullNameCustomer?.lastName || '',
          dateOfBirth: adminData.dateOfBirth || null,
          sex: adminData.sex || null,
          identityCardNumber: adminData.identityCardNumber || null,
          address: adminData.address || null,
          phoneNumber: adminData.phoneNumber || null,
          email: adminData.email || null,
          avatar: adminData.avatar || '/uploads/default-avatar.png',
          userName: userName,
          password: hashedPassword,
          userType: 'Admin',
          roles: JSON.stringify(adminData.loginInformation?.roles || ['All']),
          status: true
        };
        
        // Insert vào database
        const [result] = await connection.query(
          `INSERT INTO admins 
          (mongoId, firstName, lastName, dateOfBirth, sex, identityCardNumber, 
           address, phoneNumber, email, avatar, userName, password, userType, roles, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            insertData.mongoId,
            insertData.firstName,
            insertData.lastName,
            insertData.dateOfBirth,
            insertData.sex,
            insertData.identityCardNumber,
            insertData.address,
            insertData.phoneNumber,
            insertData.email,
            insertData.avatar,
            insertData.userName,
            insertData.password,
            insertData.userType,
            insertData.roles,
            insertData.status
          ]
        );
        
        console.log(`✅ Đã import admin "${userName}" (ID: ${result.insertId})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Lỗi import admin:`, error.message);
        errorCount++;
      }
    }
    
    // Tổng kết
    console.log('\n' + '='.repeat(50));
    console.log('🎉 HOÀN TẤT IMPORT ADMIN');
    console.log('='.repeat(50));
    console.log(`✅ Thành công: ${successCount} admin`);
    console.log(`⏭️ Bỏ qua: ${skipCount} admin (đã tồn tại hoặc thiếu thông tin)`);
    console.log(`❌ Lỗi: ${errorCount} admin`);
    console.log('='.repeat(50));
    
    // Hiển thị danh sách admin hiện có
    console.log('\n📋 DANH SÁCH ADMIN TRONG DATABASE:\n');
    const [admins] = await connection.query('SELECT _id, userName, firstName, lastName, email, phoneNumber FROM admins');
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.userName}`);
      console.log(`   Họ tên: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email || 'N/A'}`);
      console.log(`   Phone: ${admin.phoneNumber || 'N/A'}`);
      console.log('');
    });
    
    await connection.end();
    console.log('✅ Đã đóng kết nối database\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error('Chi tiết:', error);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
}

// Chạy import
console.log('╔════════════════════════════════════════════════╗');
console.log('║     IMPORT ADMIN VÀO RAILWAY MYSQL DATABASE    ║');
console.log('╚════════════════════════════════════════════════╝\n');

importAdmins();
