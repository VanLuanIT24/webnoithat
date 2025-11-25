require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function checkRegionsTable() {
  const connection = await mysql.createConnection(dbConfig);
  
  console.log('📊 Cấu trúc bảng regions:');
  const [rows] = await connection.query('DESCRIBE regions');
  console.table(rows);
  
  console.log('\n📊 Cấu trúc bảng bills:');
  const [billRows] = await connection.query('DESCRIBE bills');
  console.table(billRows);
  
  await connection.end();
}

checkRegionsTable().catch(console.error);
