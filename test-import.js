require('dotenv').config();
const db = require('./config/database');

async function testImport() {
  try {
    console.log('🧪 Testing database insert...');
    
    // Test insert
    const testData = {
      mongoId: 'test123',
      typeName: 'Test Type',
      thumbnail: '/test.jpg',
      status: true
    };
    
    console.log('Inserting test data...');
    const result = await db.insert('types', testData);
    console.log('✅ Insert successful:', result);
    
    // Test query
    console.log('Querying data...');
    const [rows] = await db.query('SELECT * FROM types WHERE mongoId = ?', ['test123']);
    console.log('✅ Query result:', rows);
    
    // Cleanup
    await db.query('DELETE FROM types WHERE mongoId = ?', ['test123']);
    console.log('✅ Cleanup done');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testImport();
