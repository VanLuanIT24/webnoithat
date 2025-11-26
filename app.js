// ======================================================
// LOAD ENV (chỉ khi chạy local)
// ======================================================
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require("express");
const app = express();
const path = require("path");

// ======================================================
// DATABASE (Railway MySQL)
// ======================================================
const mysql = require("mysql2/promise");

let db = null; // Database pool

async function connectDatabase() {
  try {
    console.log("💾 Connecting to Railway MySQL...");

    db = await mysql.createPool({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: Number(process.env.MYSQLPORT || 3306),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
      queueLimit: 0
    });

    // Test query
    await db.query("SELECT 1");

    console.log("✅ Connected to Railway MySQL successfully!");
    return true;

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("⏸️  App will continue running WITHOUT database.");
    return false;
  }
}

// ======================================================
// BASIC CONFIG
// ======================================================
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// HEALTH CHECK
// ======================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    db: db ? 'connected' : 'not_connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ======================================================
// BASIC ROUTES
// ======================================================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Railway App!',
    db_status: db ? 'connected' : 'disabled',
    check_health: '/health'
  });
});

app.get('/home', (req, res) => {
  res.json({
    message: 'Home page',
    note: db ? 'Database active' : 'Database disabled'
  });
});

app.get('/about', (req, res) => {
  res.json({ message: 'About page' });
});

app.get('/support', (req, res) => {
  res.json({ message: 'Support page' });
});

app.get('/shipping', (req, res) => {
  res.json({ message: 'Shipping info' });
});

// ======================================================
// START SERVER
// ======================================================
async function startServer() {
  console.log("🚀 Starting server...");
  console.log(`📊 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🔧 PORT: ${process.env.PORT || 3000}`);

  // Kết nối database nhưng KHÔNG CHẶN server
  await connectDatabase();

  const server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${process.env.PORT || 3000}`);
  });

  server.setTimeout(10000);
}

startServer();
