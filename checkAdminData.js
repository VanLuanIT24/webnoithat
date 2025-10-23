// checkAdminData.js - SỬA LẠI NHƯ SAU
const mongoose = require('mongoose');

// Sử dụng connection string đúng format
const MONGODB_URI = 'mongodb+srv://luanvo10042004_db_user:Maicodon1@webnoithat.yrwqgxf.mongodb.net/webnoithat?retryWrites=true&w=majority';

async function checkAdminData() {
  try {
    console.log('Đang kết nối đến MongoDB...');
    
    // Kết nối với options đầy đủ
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Tăng timeout lên 30 giây
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log('✅ Kết nối MongoDB thành công!');

    const Admin = require('./models/admin');
    
    const admins = await Admin.find({});
    console.log('📊 Tổng số admin:', admins.length);
    
    if (admins.length === 0) {
      console.log('❌ Không tìm thấy admin nào trong database');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\n👤 Admin ${index + 1}:`);
        console.log('   Username:', admin.loginInformation.userName);
        console.log('   Password:', admin.loginInformation.password);
        console.log('   Password length:', admin.loginInformation.password.length);
        console.log('   Type:', admin.loginInformation.type);
        console.log('   Roles:', admin.loginInformation.roles);
      });
    }
    
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối');
    
  } catch (error) {
    console.error('❌ Lỗi kết nối:', error.message);
    
    // Kiểm tra lỗi cụ thể
    if (error.name === 'MongooseServerSelectionError') {
      console.log('🔍 Lỗi kết nối đến server MongoDB');
      console.log('   - Kiểm tra internet');
      console.log('   - Kiểm tra credentials');
      console.log('   - Kiểm tra IP whitelist trong MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

checkAdminData();