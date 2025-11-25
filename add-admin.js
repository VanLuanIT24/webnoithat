require('dotenv').config();
const bcrypt = require('bcrypt');

// Import MySQL model
const adminModel = require('./models-mysql/admins');

async function addAdmin() {
  try {
    console.log('🔄 Bắt đầu thêm admin mới...');

    // Thông tin admin mới - BẠN CÓ THỂ CHỈNH SỬA Ở ĐÂY
    const newAdminData = {
      fullNameCustomer: {
        firstName: 'Trần Thị',
        lastName: 'B'
      },
      dateOfBirth: '15/05/1995',
      identityCardNumber: '987654321',
      address: 'Hồ Chí Minh',
      phoneNumber: '0987654321',
      email: 'admin3@example.com',
      loginInformation: {
        userName: 'admin3',           // Username để đăng nhập
        password: 'admin123',         // Mật khẩu gốc (sẽ được mã hóa)
        type: 'Admin',
        roles: ['All']                // Quyền: All, hoặc cụ thể ['Products', 'Users', 'Orders']
      },
      avatar: '/uploads/default-avatar.png'
    };

    // Kiểm tra xem username đã tồn tại chưa
    console.log('🔍 Đang kiểm tra username:', newAdminData.loginInformation.userName);
    const existingAdmin = await adminModel.findOne({ 
      userName: newAdminData.loginInformation.userName 
    });
    console.log('📊 Kết quả tìm kiếm:', existingAdmin);

    if (existingAdmin) {
      console.log('❌ Username đã tồn tại:', newAdminData.loginInformation.userName);
      console.log('💡 Vui lòng đổi username khác và chạy lại script');
      process.exit(1);
    }
    
    console.log('✅ Username chưa tồn tại, tiếp tục...');

    // Không mã hóa mật khẩu - lưu trực tiếp
    console.log('📝 Lưu mật khẩu gốc:', newAdminData.loginInformation.password);

    // Chuẩn bị dữ liệu để insert vào MySQL
    const adminData = {
      firstName: newAdminData.fullNameCustomer.firstName,
      lastName: newAdminData.fullNameCustomer.lastName,
      dateOfBirth: newAdminData.dateOfBirth,
      identityCardNumber: newAdminData.identityCardNumber,
      address: newAdminData.address,
      phoneNumber: newAdminData.phoneNumber,
      email: newAdminData.email,
      avatar: newAdminData.avatar,
      userName: newAdminData.loginInformation.userName,
      password: newAdminData.loginInformation.password,
      userType: 'Admin',
      roles: JSON.stringify(newAdminData.loginInformation.roles)
    };

    // Insert vào database
    const result = await adminModel.create(adminData);
    
    console.log('✅ Đã thêm admin mới thành công!');
    console.log('📋 Thông tin đăng nhập:');
    console.log('   Username:', newAdminData.loginInformation.userName);
    console.log('   Password:', newAdminData.loginInformation.password);
    console.log('   Họ tên:', `${newAdminData.fullNameCustomer.firstName} ${newAdminData.fullNameCustomer.lastName}`);
    console.log('   Email:', newAdminData.email);
    console.log('   ID:', result.insertId);

    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi khi thêm admin:', error.message);
    console.error('Chi tiết:', error);
    process.exit(1);
  }
}

// Chạy hàm thêm admin
addAdmin();
