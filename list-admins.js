require('dotenv').config();
const adminModel = require('./models-mysql/admins');

async function listAdmins() {
  try {
    console.log('📋 Đang lấy danh sách admin...\n');
    
    const admins = await adminModel.find({});
    
    if (admins.length === 0) {
      console.log('❌ Không có admin nào trong database');
    } else {
      console.log(`✅ Tìm thấy ${admins.length} admin:\n`);
      
      admins.forEach((admin, index) => {
        console.log(`👤 Admin ${index + 1}:`);
        console.log(`   ID: ${admin._id}`);
        console.log(`   Username: ${admin.loginInformation.userName}`);
        console.log(`   Họ tên: ${admin.fullNameCustomer.firstName} ${admin.fullNameCustomer.lastName}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Phone: ${admin.phoneNumber}`);
        console.log(`   Roles: ${admin.loginInformation.roles.join(', ')}`);
        console.log(`   Ngày tạo: ${admin.createdAt}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

listAdmins();
