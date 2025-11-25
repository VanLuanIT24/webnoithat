require('dotenv').config();

const express = require("express");
const app = express();
const path = require("path");

// KHÔNG ghi đè biến môi trường ở đây
// XÓA các dòng sau nếu có:
// process.env.DB_HOST = ...
// process.env.DB_PORT = ...

const db = require("./config/database");

// ======================================================
// IMPORT ROUTES
// ======================================================
const index = require('./routes/index.router');
const admin = require("./routes/admin.route");
const product = require("./routes/product.route");
const categories = require("./routes/categories.route");
const shipping = require('./routes/shipping.route');
const support = require('./routes/support.route');
const about = require('./routes/about.route');

// ======================================================
// EXPRESS + PASSPORT SETUP
// ======================================================
app.set("trust proxy", 1);

const flash = require('connect-flash');
const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const adminModel = require('./models-mysql/admins');
const customerModel = require('./models-mysql/customers');

// ======================================================
// MYSQL SESSION STORE CONFIG - SỬA LẠI
// ======================================================
const sessionStoreOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 phút
  expiration: 86400000, // 24 giờ
  createDatabaseTable: true,
  connectionLimit: 10,
  charset: 'utf8mb4_bin',
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
};

const sessionStore = new MySQLStore(sessionStoreOptions);

// Handle session store errors
sessionStore.on('error', (error) => {
  console.error('❌ Session store error:', error);
});

// ======================================================
// PASSPORT – USER STRATEGY
// ======================================================
passport.use(
  "user-local",
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        console.log("🔐 Passport login attempt for user:", username);
        const user = await customerModel.findOne({ userName: username });
        
        if (!user) {
          console.log("❌ User not found:", username);
          return done(null, false, { message: "Tài khoản không tồn tại!" });
        }

        console.log("✅ User found, checking password...");
        const ok = await bcrypt.compare(password, user.loginInformation.password);
        
        if (!ok) {
          console.log("❌ Password incorrect for user:", username);
          return done(null, false, { message: "Mật khẩu không đúng!" });
        }

        if (user.loginInformation.status === false) {
          console.log("❌ Account disabled:", username);
          return done(null, false, { message: "Tài khoản bị khóa!" });
        }

        console.log("✅ Login successful for user:", username);
        return done(null, user);
      } catch (e) {
        console.error("❌ Passport error:", e);
        return done(e);
      }
    }
  )
);

// ======================================================
// PASSPORT – ADMIN STRATEGY
// ======================================================
passport.use(
  "admin-local",
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        console.log("🔐 Passport admin login attempt:", username);
        const admin = await adminModel.findOne({ userName: username });
        
        if (!admin) {
          console.log("❌ Admin not found:", username);
          return done(null, false, { message: "Tài khoản admin không tồn tại!" });
        }

        // For admin, compare plain text password (adjust if you want bcrypt)
        if (admin.loginInformation.password !== password) {
          console.log("❌ Admin password incorrect:", username);
          return done(null, false, { message: "Mật khẩu không đúng!" });
        }

        console.log("✅ Admin login successful:", username);
        return done(null, admin);
      } catch (e) {
        console.error("❌ Passport admin error:", e);
        return done(e);
      }
    }
  )
);

// ======================================================
// SERIALIZE
// ======================================================
passport.serializeUser((user, done) => {
  console.log("📦 Serializing user:", user.loginInformation?.userName);
  done(null, {
    id: user._id,
    username: user.loginInformation.userName,
    type: user.loginInformation.type
  });
});

passport.deserializeUser(async (sessionUser, done) => {
  try {
    console.log("📥 Deserializing user:", sessionUser.username);
    
    if (sessionUser.type === "Admin") {
      const admin = await adminModel.findOne({ userName: sessionUser.username });
      if (!admin) {
        console.log("❌ Admin not found during deserialize");
        return done(null, false);
      }
      return done(null, admin);
    } else {
      const user = await customerModel.findOne({ userName: sessionUser.username });
      if (!user) {
        console.log("❌ User not found during deserialize");
        return done(null, false);
      }
      return done(null, user);
    }
  } catch (e) {
    console.error("❌ Deserialize error:", e);
    done(e);
  }
});

// ======================================================
// MIDDLEWARE
// ======================================================
app.use(
  session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET || 'railway-secret-key-change-this-to-random-string',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Đặt thành true nếu dùng HTTPS
      httpOnly: true,
      maxAge: 86400000 // 24 giờ
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Đảm bảo đường dẫn views đúng
app.use(express.static(path.join(__dirname, "public"))); // Đảm bảo phục vụ file tĩnh

// ======================================================
// HEALTH CHECK ENDPOINT (for Railway)
// ======================================================
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const conn = await db.getConnection();
    conn.release();
    
    res.status(200).json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ======================================================
// BASIC ROUTE FOR TESTING
// ======================================================
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    env: process.env.NODE_ENV,
    db_host: process.env.DB_HOST,
    timestamp: new Date().toISOString()
  });
});

// ======================================================
// ROUTES
// ======================================================
app.use("/", index);
app.use("/admin", admin);
app.use("/product", product);
app.use("/categories", categories);
app.use("/shipping", shipping);
app.use("/support", support);
app.use("/about", about);

// ======================================================
// 404 HANDLER
// ======================================================
app.use((req, res) => {
  res.status(404).render('404', {
    message: 'Trang không tồn tại',
    customer: req.user || null
  });
});

// ======================================================
// ERROR HANDLING
// ======================================================
app.use((err, req, res, next) => {
  console.error('❌ Application error:', err);
  res.status(500).render('error', {
    message: 'Có lỗi xảy ra trong ứng dụng',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// ======================================================
// SERVER STARTUP
// ======================================================
const PORT = process.env.PORT || 3000;

// Test database connection before starting server
async function startServer() {
  try {
    console.log("🔌 Testing database connection...");
    const conn = await db.getConnection();
    conn.release();
    console.log("✅ Database connection successful!");

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
    }).on('error', (err) => {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⏳ Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
}

startServer();