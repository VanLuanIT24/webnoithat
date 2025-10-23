const mongoose = require('mongoose');
const fs = require('fs');

// Kết nối MongoDB
mongoose.connect('mongodb+srv://luanvo10042004_db_user:Maicodon1@webnoithat.yrwqgxf.mongodb.net/webnoithat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Admin = require('./models/admin');
const Bill = require('./models/bills');
const Customer = require('./models/customers');
const Product = require('./models/products');
const Region = require('./models/region');
const Supplier = require('./models/suppliers');
const Type = require('./models/types');

// Hàm chuyển đổi dữ liệu _id từ format { $oid: ... } sang ObjectId
function convertData(data) {
  return data.map(item => {
    if (item._id && item._id.$oid) {
      item._id = new mongoose.Types.ObjectId(item._id.$oid);
    }
    return item;
  });
}

async function importData() {
  try {
    // Đọc và import từng file JSON từ thư mục Database
    const adminsData = convertData(JSON.parse(fs.readFileSync('./Database/Admins.json', 'utf8')));
    const billsData = convertData(JSON.parse(fs.readFileSync('./Database/Bills.json', 'utf8')));
    const customersData = convertData(JSON.parse(fs.readFileSync('./Database/Customers.json', 'utf8')));
    const productsData = convertData(JSON.parse(fs.readFileSync('./Database/Products.json', 'utf8')));
    const regionsData = convertData(JSON.parse(fs.readFileSync('./Database/Regions.json', 'utf8')));
    const suppliersData = convertData(JSON.parse(fs.readFileSync('./Database/Suppliers.json', 'utf8')));
    const typesData = convertData(JSON.parse(fs.readFileSync('./Database/Type.json', 'utf8')));

    console.log('Bắt đầu import dữ liệu...');

    // Xóa dữ liệu cũ
    console.log('Đang xóa dữ liệu cũ...');
    await Admin.deleteMany({});
    await Bill.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Region.deleteMany({});
    await Supplier.deleteMany({});
    await Type.deleteMany({});

    // Import dữ liệu mới
    console.log('Đang import admins...');
    await Admin.insertMany(adminsData);
    
    console.log('Đang import bills...');
    await Bill.insertMany(billsData);
    
    console.log('Đang import customers...');
    await Customer.insertMany(customersData);
    
    console.log('Đang import products...');
    await Product.insertMany(productsData);
    
    console.log('Đang import regions...');
    await Region.insertMany(regionsData);
    
    console.log('Đang import suppliers...');
    await Supplier.insertMany(suppliersData);
    
    console.log('Đang import types...');
    await Type.insertMany(typesData);

    console.log('Import dữ liệu thành công!');
    console.log(`- Admins: ${adminsData.length} bản ghi`);
    console.log(`- Bills: ${billsData.length} bản ghi`);
    console.log(`- Customers: ${customersData.length} bản ghi`);
    console.log(`- Products: ${productsData.length} bản ghi`);
    console.log(`- Regions: ${regionsData.length} bản ghi`);
    console.log(`- Suppliers: ${suppliersData.length} bản ghi`);
    console.log(`- Types: ${typesData.length} bản ghi`);
    
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi import dữ liệu:', error);
    process.exit(1);
  }
}

importData();