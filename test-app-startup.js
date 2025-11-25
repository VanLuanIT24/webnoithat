require('dotenv').config();

console.log('='.repeat(50));
console.log('🧪 TESTING APP STARTUP');
console.log('='.repeat(50));

console.log('\n📋 Environment Variables:');
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);

console.log('\n🔄 Loading app.js...\n');

try {
  require('./app.js');
  console.log('\n✅ App loaded successfully!');
} catch (error) {
  console.error('\n❌ Error loading app:');
  console.error(error);
  process.exit(1);
}
