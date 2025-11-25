require('dotenv').config();
const adminModel = require('./models-mysql/admins');

async function testAdminModel() {
  try {
    console.log('🔍 Test admin model...\n');
    
    const admin = await adminModel.findOne({ userName: 'admin' });
    
    console.log('Admin object:', JSON.stringify(admin, null, 2));
    console.log('\nloginInformation:', admin?.loginInformation);
    console.log('password:', admin?.loginInformation?.password);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

testAdminModel();
