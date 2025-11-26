// app.js
require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");

// ======================================================
// BASIC CONFIG - KHỞI TẠO ĐƠN GIẢN TRƯỚC
// ======================================================
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// HEALTH CHECK - ROUTE ĐẦU TIÊN, KHÔNG PHỤ THUỘC DATABASE
// ======================================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is starting up...',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Application is starting...',
    status: 'initializing'
  });
});

// ======================================================
// KHỞI TẠO DATABASE & SESSION STORE SAU
// ======================================================
async function initializeApp() {
  try {
    console.log("🔄 Initializing database connection...");
    
    const db = require("./config/database");
    const conn = await db.getConnection();
    conn.release();
    console.log("✅ Database connected!");

    // ======================================================
    // IMPORT ROUTES SAU KHI DATABASE READY
    // ======================================================
    const flash = require('connect-flash');
    const session = require("express-session");
    const MySQLStore = require('express-mysql-session')(session);
    const passport = require("passport");

const sessionStoreOptions = {
  host: process.env.MYSQLHOST,
  port: parseInt(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000,
  createDatabaseTable: true,
  charset: 'utf8mb4_bin',
};
    const sessionStore = new MySQLStore(sessionStoreOptions);

    // Session middleware
    app.use(session({
      key: 'session_cookie_name',
      secret: process.env.SESSION_SECRET || 'railway-secret-key',
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 86400000
      }
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    // Global variables
    app.use((req, res, next) => {
      res.locals.user = req.user;
      res.locals.isAuthenticated = req.isAuthenticated();
      res.locals.success = req.flash("success");
      res.locals.error = req.flash("error");
      next();
    });

    // ======================================================
    // IMPORT & USE ROUTES
    // ======================================================
    const index = require('./routes/index.router');
    const admin = require("./routes/admin.route");
    const product = require("./routes/product.route");
    const categories = require("./routes/categories.route");
    const shipping = require('./routes/shipping.route');
    const support = require('./routes/support.route');
    const about = require('./routes/about.route');

    app.use("/", index);
    app.use("/admin", admin);
    app.use("/product", product);
    app.use("/categories", categories);
    app.use("/shipping", shipping);
    app.use("/support", support);
    app.use("/about", about);

    // Update health check
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'READY', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    });

    app.get('/', (req, res) => {
      res.redirect('/home');
    });

    console.log("✅ All routes initialized!");

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    
    // Fallback routes khi khởi tạo thất bại
    app.get('*', (req, res) => {
      res.status(500).json({
        error: 'Application initializing...',
        message: 'Please refresh the page in a few moments'
      });
    });
  }
}

// ======================================================
// START SERVER - KHỞI ĐỘNG SERVER TRƯỚC, INIT SAU
// ======================================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Khởi tạo app bất đồng bộ sau khi server đã start
  initializeApp();
});

// Timeout để tránh treo
server.setTimeout(30000);