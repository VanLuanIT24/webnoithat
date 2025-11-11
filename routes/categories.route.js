// routes/categories.route.js
const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/CategoriesController');

// Thêm route cho trang danh sách danh mục
// XÓA DÒNG NÀY vì không có phương thức getAllCategories
// router.get('/', categoriesController.getAllCategories); 

router.get('/:id', categoriesController.getList); // Trang sản phẩm theo danh mục
router.get('/:id/page/:page', categoriesController.getListAtPage); // Phân trang

module.exports = router;