require('dotenv').config(); // Load env đầu tiên

// Đọc DB config từ env
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3306';

const fs = require('fs');
const path = require('path');
const { setupDatabase } = require('./mysql-setup');

// Import MySQL models
const {
  types: Type,
  suppliers: Supplier,
  customers: Customer,
  products: Product,
  bills: Bill,
  regions: Region,
  admins: Admin
} = require('./models-mysql');

// Đọc dữ liệu từ các file JSON trong thư mục Databases
function readJSONFile(filename) {
  try {
    const filePath = path.join(__dirname, 'Database', filename);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File ${filename} không tồn tại tại: ${filePath}`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Lỗi đọc file ${filename}:`, error.message);
    return [];
  }
}

// Hàm xử lý giá trị undefined
function sanitizeValue(value, defaultValue = '') {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value;
}

async function importData() {
  try {
    console.log('🔄 Bắt đầu import dữ liệu từ JSON files...');

    // Thiết lập MySQL database
    await setupDatabase();
    console.log('✅ Đã kết nối MySQL database');

    // Xóa dữ liệu cũ
    console.log('🗑️ Đang xóa dữ liệu cũ...');
    const db = require('./config/database');
    
    // Tắt foreign key checks tạm thời
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await db.query('DELETE FROM bills');
    await db.query('DELETE FROM products');
    await db.query('DELETE FROM customers');
    await db.query('DELETE FROM suppliers');
    await db.query('DELETE FROM types');
    await db.query('DELETE FROM admins');
    await db.query('DELETE FROM regions');
    
    // Bật lại foreign key checks
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Đã xóa dữ liệu cũ');

    // Import types - SỬA LỖI: Dùng Type.create() thay vì Supplier.create()
    console.log('📦 Đang import types...');
    const typesData = readJSONFile('Types.json');
    let typeCount = 0;
    for (const typeData of typesData) {
      try {
        // Xử lý mongoId
        let mongoId = typeData._id;
        if (typeof mongoId === 'object' && mongoId.$oid) {
          mongoId = mongoId.$oid;
        }
        
        const mysqlData = {
          mongoId: mongoId,
          typeName: sanitizeValue(typeData.typeName),
          thumbnail: sanitizeValue(typeData.thumbnail),
          status: typeData.status !== false
        };
        await Type.create(mysqlData); // SỬA: Type.create() thay vì Supplier.create()
        typeCount++;
      } catch (error) {
        console.error(`❌ Lỗi import type:`, error.message);
      }
    }
    console.log(`✅ Đã import ${typeCount} types`);

    // Import suppliers
    console.log('📦 Đang import suppliers...');
    const suppliersData = readJSONFile('Suppliers.json');
    let supplierCount = 0;
    for (const supplierData of suppliersData) {
      try {
        // Xử lý mongoId
        let mongoId = supplierData._id;
        if (typeof mongoId === 'object' && mongoId.$oid) {
          mongoId = mongoId.$oid;
        }
        
        const mysqlData = {
          mongoId: mongoId,
          supplierName: sanitizeValue(supplierData.supplierName),
          status: supplierData.status !== false
        };
        await Supplier.create(mysqlData);
        supplierCount++;
      } catch (error) {
        console.error(`❌ Lỗi import supplier:`, error.message);
      }
    }
    console.log(`✅ Đã import ${supplierCount} suppliers`);

    // Import admins
    console.log('📦 Đang import admins...');
    const adminsData = readJSONFile('Admins.json');
    let adminCount = 0;
    for (const adminData of adminsData) {
      try {
        // Xử lý mongoId
        let mongoId = adminData._id;
        if (typeof mongoId === 'object' && mongoId.$oid) {
          mongoId = mongoId.$oid;
        }
        
        const mysqlData = {
          mongoId: mongoId,
          firstName: sanitizeValue(adminData.fullNameCustomer?.firstName),
          lastName: sanitizeValue(adminData.fullNameCustomer?.lastName),
          dateOfBirth: sanitizeValue(adminData.dateOfBirth),
          sex: adminData.sex === true ? 'male' : (adminData.sex === false ? 'female' : 'other'),
          identityCardNumber: sanitizeValue(adminData.identityCardNumber),
          address: sanitizeValue(adminData.address),
          phoneNumber: sanitizeValue(adminData.phoneNumber),
          email: sanitizeValue(adminData.email),
          avatar: sanitizeValue(adminData.avatar),
          userName: sanitizeValue(adminData.loginInformation?.userName, 'admin'),
          password: sanitizeValue(adminData.loginInformation?.password, 'admin'),
          userType: sanitizeValue(adminData.loginInformation?.type, 'Admin'),
          roles: JSON.stringify(adminData.loginInformation?.roles || ['All'])
        };
        await Admin.create(mysqlData);
        adminCount++;
      } catch (error) {
        console.error(`❌ Lỗi import admin:`, error.message);
      }
    }
    console.log(`✅ Đã import ${adminCount} admins`);

    // Import customers
    console.log('📦 Đang import customers...');
    const customersData = readJSONFile('Customers.json');
    let customerCount = 0;
    
    // Tạo map để lưu mongoId -> mysqlId
    const customerIdMap = new Map();

    for (const customerData of customersData) {
      try {
        // Xử lý mongoId
        let mongoId = customerData._id;
        if (typeof mongoId === 'object' && mongoId.$oid) {
          mongoId = mongoId.$oid;
        }
        
        const mysqlData = {
          mongoId: mongoId,
          firstName: sanitizeValue(customerData.fullNameCustomer?.firstName),
          lastName: sanitizeValue(customerData.fullNameCustomer?.lastName),
          dateOfBirth: sanitizeValue(customerData.dateOfBirth),
          sex: customerData.sex === true ? 'male' : (customerData.sex === false ? 'female' : 'other'),
          identityCardNumber: sanitizeValue(customerData.identityCardNumber),
          address: sanitizeValue(customerData.address),
          phoneNumber: sanitizeValue(customerData.phoneNumber),
          email: sanitizeValue(customerData.email),
          avatar: sanitizeValue(customerData.avatar),
          userName: sanitizeValue(customerData.loginInformation?.userName, `user${customerCount + 1}`),
          password: sanitizeValue(customerData.loginInformation?.password, '123'),
          userType: sanitizeValue(customerData.loginInformation?.type, 'User'),
          roles: JSON.stringify(customerData.loginInformation?.roles || ['Normal']),
          status: customerData.loginInformation?.status !== false,
          listProduct: JSON.stringify(customerData.listProduct || []),
          listFavorite: JSON.stringify(customerData.listFavorite || [])
        };

        // Sử dụng Customer.create để insert
        const result = await Customer.create(mysqlData);
        // Lưu mapping mongoId -> mysqlId
        if (result && result._id) {
          customerIdMap.set(customerData._id, result._id);
        }
        customerCount++;
        if (customerCount % 5 === 0) {
          console.log(`   ✅ Đã import ${customerCount} customers...`);
        }
      } catch (error) {
        console.error(`❌ Lỗi import customer ${customerCount + 1}:`, error.message);
      }
    }
    console.log(`✅ Đã import ${customerCount} customers`);

    // Import products
    console.log('📦 Đang import products...');
    const productsData = readJSONFile('Products.json');
    let productCount = 0;
    for (const productData of productsData) {
      try {
        // Xử lý mongoId
        let mongoId = productData._id;
        if (typeof mongoId === 'object' && mongoId.$oid) {
          mongoId = mongoId.$oid;
        }
        
        const mysqlData = {
          mongoId: mongoId,
          productName: sanitizeValue(productData.productName),
          description: JSON.stringify(productData.description || {}),
          discount: JSON.stringify(productData.discount || {}),
          rating: JSON.stringify(productData.rating || {})
        };
        await Product.create(mysqlData);
        productCount++;
      } catch (error) {
        console.error(`❌ Lỗi import product:`, error.message);
      }
    }
    console.log(`✅ Đã import ${productCount} products`);

    // Import regions
    console.log('📦 Đang import regions...');
    const regionsData = readJSONFile('Regions.json');
    let regionCount = 0;
    for (const regionData of regionsData) {
      try {
        // Xử lý mongoId
        let mongoId = regionData._id;
        if (typeof mongoId === 'object' && mongoId.$oid) {
          mongoId = mongoId.$oid;
        }
        
        const mysqlData = {
          mongoId: mongoId,
          region: sanitizeValue(regionData.Name),
          details: JSON.stringify(regionData.Districts || [])
        };
        await Region.create(mysqlData);
        regionCount++;
      } catch (error) {
        console.error(`❌ Lỗi import region:`, error.message);
      }
    }
    console.log(`✅ Đã import ${regionCount} regions`);

    // Import bills
    console.log('📦 Đang import bills...');
    const billsData = readJSONFile('Bills.json');
    let billCount = 0;
    
    for (const billData of billsData) {
      try {
        // Xử lý mongoId
        let mongoId = billData._id;
        if (typeof mongoId === 'object' && mongoId.$oid) {
          mongoId = mongoId.$oid;
        }
        
        // Tìm userID tương ứng trong MySQL từ map
        let userID = null;
        if (billData.userID && customerIdMap.has(billData.userID)) {
          userID = customerIdMap.get(billData.userID);
        }

        const mysqlData = {
          mongoId: mongoId,
          userID: userID,
          userMongoId: sanitizeValue(billData.userId?.$oid || billData.userId),
          firstName: sanitizeValue(billData.displayName?.firstName),
          lastName: sanitizeValue(billData.displayName?.lastName),
          listProduct: JSON.stringify(billData.listProduct || []),
          address: sanitizeValue(billData.address),
          paymentMethod: sanitizeValue(billData.paymentMethod),
          resquest: sanitizeValue(billData.resquest),
          status: sanitizeValue(billData.status, 'Chờ xác nhận')
        };

        await Bill.create(mysqlData);
        billCount++;
        if (billCount % 5 === 0) {
          console.log(`   ✅ Đã import ${billCount} bills...`);
        }
      } catch (error) {
        console.error(`❌ Lỗi import bill ${billCount + 1}:`, error.message);
      }
    }
    console.log(`✅ Đã import ${billCount} bills`);

    console.log('🎉 Import dữ liệu hoàn tất!');
    console.log('📊 Tổng kết:');
    console.log(`   👤 Admins: ${adminCount}`);
    console.log(`   🏢 Suppliers: ${supplierCount}`);
    console.log(`   📁 Types: ${typeCount}`);
    console.log(`   👥 Customers: ${customerCount}`);
    console.log(`   📦 Products: ${productCount}`);
    console.log(`   🗺️ Regions: ${regionCount}`);
    console.log(`   🧾 Bills: ${billCount}`);
    console.log('');
    console.log('🔑 Thông tin đăng nhập:');
    console.log('   Admin: username="admin", password="admin"');
    console.log('   Users: username="user1", "user2", ... password="123"');

    // Hiển thị thông tin đăng nhập chi tiết
    console.log('\n🔍 Chi tiết đăng nhập:');
    try {
      const [customers] = await db.query('SELECT userName, password FROM customers LIMIT 5');
      if (customers && customers.length > 0) {
        customers.forEach(customer => {
          console.log(`   User: username="${customer.userName}", password="${customer.password}"`);
        });
      }
    } catch (err) {
      console.log('   (Không thể lấy thông tin đăng nhập)');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi import dữ liệu:', error);
    console.error('Chi tiết lỗi:', error.message);
    process.exit(1);
  }
}

importData();