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
// HEALTH CHECK
// ======================================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Railway App!',
    status: 'running',
    check_health: '/health'
  });
});

// ======================================================
// SIMPLE ROUTES KHÔNG CẦN DATABASE
// ======================================================
app.get('/home', (req, res) => {
  res.json({ message: 'Home page - Database connection in progress' });
});

// ======================================================
// DATABASE CONNECTION
// ======================================================
async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database connection...");
    
    const db = require("./config/database");
    
    // Test connection đơn giản
    const connection = await db.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ======================================================
// INITIALIZE APP
// ======================================================
async function initializeApp() {
  try {
    console.log("🔄 Starting application initialization...");
    
    // Kết nối database
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // ======================================================
    // SETUP SESSION & PASSPORT
    // ======================================================
    const flash = require('connect-flash');
    const session = require("express-session");
    const MySQLStore = require('express-mysql-session')(session);
    const passport = require("passport");

    // Session store configuration - SỬ DỤNG TRỰC TIẾP GIÁ TRỊ
    const sessionStoreOptions = {
      host: process.env.MYSQLHOST || 'switchback.proxy.rlwy.net',
      port: parseInt(process.env.MYSQLPORT || '28295'),
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || 'YeakDPlKQyydaJjcmShgqHXyXoYOAmaS',
      database: process.env.MYSQLDATABASE || 'railway',
      clearExpired: true,
      checkExpirationInterval: 900000,
      expiration: 86400000,
      createDatabaseTable: true,
      charset: 'utf8mb4_bin',
    };

    console.log("🔄 Initializing session store...");
    const sessionStore = new MySQLStore(sessionStoreOptions);

    app.use(session({
      key: 'session_cookie_name',
      secret: process.env.SESSION_SECRET || 'railway-secret-key-change-this-to-random-string',
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
    // LOAD ROUTES
    // ======================================================
    console.log("🔄 Loading routes...");
    
    const index = require('./routes/index.router');
    const admin = require("./routes/admin.route");
    const product = require("./routes/product.route");
    const categories = require("./routes/categories.route');
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

    console.log("✅ All routes initialized!");

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

  } catch (error) {
    console.error('❌ App initialization failed:', error.message);
    
    // Fallback routes
    app.get('*', (req, res) => {
      res.status(200).json({
        status: 'starting',
        message: 'Application is starting up, please wait...',
        error: error.message
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
console.log(`🔧 Port: ${PORT}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  
  // Khởi tạo app
  initializeApp();
});

server.setTimeout(30000);