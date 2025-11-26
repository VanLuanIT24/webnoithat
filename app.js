require('dotenv').config();
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
// HEALTH CHECK ROUTES (KHÔNG CẦN DATABASE)
// ======================================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: 'checking...'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Application is starting...',
    status: 'initializing'
  });
});

// ======================================================
// KHỞI TẠO DATABASE & APP
// ======================================================
async function initializeApp() {
  try {
    console.log("🔄 Initializing database connection...");
    
    const db = require("./config/database");
    
    // Test connection với timeout
    const connectionTest = await Promise.race([
      db.testConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 30000)
      )
    ]);

    if (!connectionTest) {
      throw new Error('Database connection test failed');
    }

    console.log("✅ Database connected successfully!");

    // ======================================================
    // CẤU HÌNH SESSION STORE
    // ======================================================
    const flash = require('connect-flash');
    const session = require("express-session");
    const MySQLStore = require('express-mysql-session')(session);
    const passport = require("passport");

    // Sử dụng cùng config với database connection
    const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST;
    const DB_PORT = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306');
    const DB_USER = process.env.MYSQLUSER || process.env.DB_USER;
    const DB_PASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
    const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME;

    const sessionStoreOptions = {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: 86400000,
      createDatabaseTable: true,
      charset: 'utf8mb4_bin',
      connectionLimit: 10,
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
    };

    console.log("🔄 Initializing session store...");
    const sessionStore = new MySQLStore(sessionStoreOptions);

    // Session middleware
    app.use(session({
      key: 'session_cookie_name',
      secret: process.env.SESSION_SECRET || 'railway-secret-key',
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
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
    console.log("🔄 Loading routes...");
    
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

    // Update health check sau khi database ready
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

    console.log("✅ All routes initialized successfully!");

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    
    // Fallback routes khi khởi tạo thất bại
    app.get('*', (req, res) => {
      res.status(503).json({
        status: 'initializing',
        error: 'Application is starting up...',
        message: 'Please refresh the page in a few moments'
      });
    });
  }
}

// ======================================================
// START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

console.log("🚀 Starting server...");
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 Available ENV keys:`, Object.keys(process.env).filter(key => 
  key.includes('MYSQL') || key.includes('DB') || key.includes('DATABASE')
));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  
  // Khởi tạo app bất đồng bộ sau khi server đã start
  initializeApp();
});

server.setTimeout(30000);