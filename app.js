const express = require("express");
const app = express();
const path = require("path");
require('./config/database');
const index = require('./routes/index.router');
const admin = require("./routes/admin.route");
const product = require("./routes/product.route");
const categories = require("./routes/categories.route");
const shipping = require('./routes/shipping.route');
const support = require('./routes/support.route');
const about = require('./routes/about.route');
const PORT = process.env.PORT || 3000;
// Nếu app chạy sau proxy (Railway), bật trust proxy để cookie secure và IP forwarding hoạt động
app.set('trust proxy', 1);
const flash = require('connect-flash');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');

// Import MySQL models
const adminModel = require('./models-mysql/admins');
const customerModel = require('./models-mysql/customers');

// Cấu hình Passport Strategies - SỬA LẠI HOÀN TOÀN
// Strategy cho user
passport.use('user-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  try {
    console.log('Trying to authenticate user:', username);
    
    // SỬA: Tìm user bằng userName
    const user = await customerModel.findOne({ userName: username });
    
    if (!user) {
      console.log('User not found');
      return done(null, false, { message: 'Tài khoản không tồn tại!' });
    }
    
    if (!user.loginInformation.password) {
      console.log('Authentication failed: user has no password set:', username);
      return done(null, false, { message: 'Tài khoản chưa đặt mật khẩu.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.loginInformation.password);
    if (!isMatch) {
      console.log('Password incorrect');
      return done(null, false, { message: 'Mật khẩu không đúng!' });
    }
    
    if (user.loginInformation.status === false) {
      console.log('Account blocked');
      return done(null, false, { message: 'Tài khoản đã bị khóa!' });
    }
    
    console.log('User authenticated successfully');
    return done(null, user);
  } catch (error) {
    console.error('Authentication error:', error);
    return done(error);
  }
}));

// Strategy cho admin
passport.use('admin-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  try {
    console.log('Trying to authenticate admin:', username);
    
    // SỬA: Tìm admin bằng userName
    const admin = await adminModel.findOne({ userName: username });
    
    if (!admin) {
      console.log('Admin not found');
      return done(null, false, { message: 'Tài khoản admin không tồn tại!' });
    }
    
    if (admin.loginInformation.password !== password) {
      console.log('Admin password incorrect');
      return done(null, false, { message: 'Mật khẩu không đúng!' });
    }
    
    console.log('Admin authenticated successfully');
    return done(null, admin);
  } catch (error) {
    console.error('Admin authentication error:', error);
    return done(error);
  }
}));

// Serialize user
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user.loginInformation?.userName);
  done(null, {
    id: user._id,
    username: user.loginInformation.userName,
    type: user.loginInformation.type
  });
});

// Deserialize user
passport.deserializeUser(async (sessionUser, done) => {
  try {
    console.log('Deserializing user:', sessionUser);
    
    if (sessionUser.type === 'Admin') {
      const admin = await adminModel.findOne({ userName: sessionUser.username });
      done(null, admin);
    } else {
      const user = await customerModel.findOne({ userName: sessionUser.username });
      done(null, user);
    }
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error);
  }
});

app.use(
  session({
    secret: "thesecret",
    saveUninitialized: true,
    resave: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/")));

// Router
app.use("/", index);
app.use('/admin', admin);
app.use("/product", product);
app.use("/categories", categories);
app.use('/shipping', shipping);
app.use('/support', support);
app.use('/about', about);

app.listen(PORT, () => {
  console.log(`Server is started at: 0.0.0.0:${PORT}`);
});