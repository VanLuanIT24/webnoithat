// routes/about.route.js
const express = require('express');
const router = express.Router();

// Route cho trang "Về chúng tôi"
router.get('/', (req, res) => {
  res.render('about'); // Render file about.ejs
});

module.exports = router;
