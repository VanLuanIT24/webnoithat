// check-env.js - Script để kiểm tra biến môi trường trên Railway
require('dotenv').config();

console.log('\n='.repeat(60));
console.log('🔍 KIỂM TRA BIẾN MÔI TRƯỜNG');
console.log('='.repeat(60));

console.log('\n📋 Tất cả biến môi trường liên quan đến MySQL/Database:');
Object.keys(process.env)
  .filter(key => 
    key.includes('MYSQL') || 
    key.includes('DB') || 
    key.includes('DATABASE') ||
    key.includes('SQL')
  )
  .sort()
  .forEach(key => {
    const value = process.env[key];
    const displayValue = key.toLowerCase().includes('password') 
      ? '***' 
      : value;
    console.log(`  ${key} = ${displayValue}`);
  });

console.log('\n📋 Biến Railway chuẩn:');
console.log(`  MYSQLHOST = ${process.env.MYSQLHOST || 'undefined'}`);
console.log(`  MYSQLUSER = ${process.env.MYSQLUSER || 'undefined'}`);
console.log(`  MYSQLPASSWORD = ${process.env.MYSQLPASSWORD ? '***' : 'undefined'}`);
console.log(`  MYSQLDATABASE = ${process.env.MYSQLDATABASE || 'undefined'}`);
console.log(`  MYSQLPORT = ${process.env.MYSQLPORT || 'undefined'}`);

console.log('\n📋 Biến custom (DB_):');
console.log(`  DB_HOST = ${process.env.DB_HOST || 'undefined'}`);
console.log(`  DB_USER = ${process.env.DB_USER || 'undefined'}`);
console.log(`  DB_PASSWORD = ${process.env.DB_PASSWORD ? '***' : 'undefined'}`);
console.log(`  DB_NAME = ${process.env.DB_NAME || 'undefined'}`);
console.log(`  DB_PORT = ${process.env.DB_PORT || 'undefined'}`);

console.log('\n📋 Biến MYSQL_:');
console.log(`  MYSQL_HOST = ${process.env.MYSQL_HOST || 'undefined'}`);
console.log(`  MYSQL_USER = ${process.env.MYSQL_USER || 'undefined'}`);
console.log(`  MYSQL_PASSWORD = ${process.env.MYSQL_PASSWORD ? '***' : 'undefined'}`);
console.log(`  MYSQL_DATABASE = ${process.env.MYSQL_DATABASE || 'undefined'}`);
console.log(`  MYSQL_PORT = ${process.env.MYSQL_PORT || 'undefined'}`);

console.log('\n📋 Biến DATABASE_URL:');
console.log(`  DATABASE_URL = ${process.env.DATABASE_URL || 'undefined'}`);

console.log('\n' + '='.repeat(60));
