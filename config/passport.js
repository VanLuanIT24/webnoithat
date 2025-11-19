const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const customers = require('../models-mysql/customers');
const admins = require('../models-mysql/admins');

// Strategy cho user
passport.use('user-local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  try {
    console.log('Trying to authenticate user:', username);
    
    const user = await customers.findOne({ 'loginInformation.userName': username });
    
    if (!user) {
      console.log('User not found');
      return done(null, false, { message: 'Tài khoản không tồn tại!' });
    }
    
    if (user.loginInformation.password !== password) {
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
    
    const admin = await admins.findOne({ 'loginInformation.userName': username });
    
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
      const admin = await admins.findOne({ 'loginInformation.userName': sessionUser.username });
      done(null, admin);
    } else {
      const user = await customers.findOne({ 'loginInformation.userName': sessionUser.username });
      done(null, user);
    }
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error);
  }
});

module.exports = passport;