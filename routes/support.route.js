// routes/support.route.js
const express = require('express');
const router = express.Router();

// Định nghĩa route cho trang "Hỗ trợ"
router.get('/', (req, res) => {
  res.render('support'); // Render file support.ejs
});

module.exports = router;
