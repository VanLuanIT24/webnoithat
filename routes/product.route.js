// routes/product.route.js
const express = require('express');
const router = express.Router();

const productController = require('../controllers/ProductController');

router.get('/search', productController.search);
router.get('/:id', productController.productDetail);
router.get('/page/:page', productController.productAtPage);
router.post('/filter', productController.filterProduct); // POST cho form submit
router.get('/filter', productController.filterProductGet); // GET cho URL parameters
router.get('/filter/:page', productController.filterProductAtPage)
router.get('/', productController.getProductDefault)

module.exports = router;