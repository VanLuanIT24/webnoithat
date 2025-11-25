require('dotenv').config();

const express = require("express");
const app = express();
const path = require("path");

// ❌ XÓA 2 dòng sai gây ghi đè ENV:
// process.env.DB_HOST = ...
// process.env.DB_PORT = ...

require("./config/database");

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
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const adminModel = require('./models-mysql/admins');
const customerModel = require('./models-mysql/customers');

// ======================================================
// PASSPORT – USER STRATEGY
// ======================================================
passport.use(
  "user-local",
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const user = await customerModel.findOne({ userName: username });
        if (!user) return done(null, false, { message: "Tài khoản không tồn tại!" });

        const ok = await bcrypt.compare(password, user.loginInformation.password);
        if (!ok) return done(null, false, { message: "Mật khẩu không đúng!" });

        if (user.loginInformation.status === false)
          return done(null, false, { message: "Tài khoản bị khóa!" });

        return done(null, user);
      } catch (e) {
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
        const admin = await adminModel.findOne({ userName: username });
        if (!admin)
          return done(null, false, { message: "Tài khoản admin không tồn tại!" });

        if (admin.loginInformation.password !== password)
          return done(null, false, { message: "Mật khẩu không đúng!" });

        return done(null, admin);
      } catch (e) {
        return done(e);
      }
    }
  )
);

// ======================================================
// SERIALIZE
// ======================================================
passport.serializeUser((user, done) => {
  done(null, {
    id: user._id,
    username: user.loginInformation.userName,
    type: user.loginInformation.type
  });
});

passport.deserializeUser(async (sessionUser, done) => {
  try {
    if (sessionUser.type === "Admin") {
      const admin = await adminModel.findOne({ userName: sessionUser.username });
      return done(null, admin);
    } else {
      const user = await customerModel.findOne({ userName: sessionUser.username });
      return done(null, user);
    }
  } catch (e) {
    done(e);
  }
});

// ======================================================
// MIDDLEWARE
// ======================================================
app.use(
  session({
    secret: "thesecret",
    saveUninitialized: true,
    resave: false,
    cookie: { secure: false, maxAge: 86400000 }
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

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
app.use(express.static(path.join(__dirname)));

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
// SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
