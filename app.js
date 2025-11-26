// Chỉ require dotenv khi development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require("express");
const app = express();
const path = require("path");

// ======================================================
// BASIC CONFIG
// ======================================================
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// HEALTH CHECK & BASIC ROUTES - KHÔNG CẦN DATABASE
// ======================================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'Server is running without database',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Railway App!',
    status: 'running - database disabled',
    check_health: '/health'
  });
});

app.get('/home', (req, res) => {
  res.json({ 
    message: 'Home page',
    note: 'Database connection is temporarily disabled'
  });
});

// ======================================================
// ROUTES KHÔNG CẦN DATABASE
// ======================================================
app.get('/about', (req, res) => {
  res.json({ message: 'About page - basic version' });
});

app.get('/support', (req, res) => {
  res.json({ message: 'Support page - basic version' });
});

app.get('/shipping', (req, res) => {
  res.json({ message: 'Shipping info - basic version' });
});

// ======================================================
// INITIALIZE APP - KHÔNG DATABASE
// ======================================================
async function initializeApp() {
  try {
    console.log("🔄 Starting application WITHOUT database...");
    
    // TẠM THỜI KHÔNG KẾT NỐI DATABASE
    console.log("⏸️  Database connection temporarily disabled");
    
    // Load basic routes không cần database
    console.log("✅ Basic routes initialized!");
    
  } catch (error) {
    console.error('❌ App initialization failed:', error.message);
  }
}

// ======================================================
// START SERVER - ƯU TIÊN SERVER CHẠY TRƯỚC
// ======================================================
const PORT = process.env.PORT || 3000;

console.log("🚀 Starting server (FAST MODE - no database)...");
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${PORT}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running FAST on port ${PORT}`);
  console.log(`🌐 Access your app now!`);
  
  // Khởi tạo app (không database)
  initializeApp();
});

server.setTimeout(10000);