// routes/shipping.route.js
const express = require('express');
const router = express.Router();

// Định nghĩa route cho trang "Phí vận chuyển"
router.get('/', (req, res) => {
  res.render('shipping'); // Render file shipping.ejs
});

module.exports = router;
