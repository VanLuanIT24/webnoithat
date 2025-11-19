// controllers/ProductController.js
const product = require("../models-mysql/products");
const type = require("../models-mysql/types");
const supplier = require("../models-mysql/suppliers");
const customers = require("../models-mysql/customers");

class ProductController {
  async productDetail(req, res, next) {
    try {
      const id = req.params.id;
      const result = await product.findById(id);
      
      if (req.isAuthenticated()) {
        const username = req.session.passport.user.username;
        const customerResult = await customers.findOne({ userName: username });
        res.render("product-details", { data: result, customer: customerResult });
      } else {
        res.render("product-details", { data: result, customer: undefined });
      }
    } catch (err) {
      console.error(err);
      req.flash("error", "Không tìm thấy sản phẩm!");
      res.redirect('/product');
    }
  }

  async search(req, res, next) {
    try {
      const key = req.query.search;
      const [typeResult, supplierResult, productResult] = await Promise.all([
        type.find({}),
        supplier.find({}),
        product.searchByName(key)
      ]);

      if (req.isAuthenticated()) {
        const username = req.session.passport.user.username;
        const customerResult = await customers.findOne({ userName: username });
        res.render('search', {
          types: typeResult,
          suppliers: supplierResult,
          products: productResult,
          key: key,
          customer: customerResult
        });
      } else {
        res.render('search', {
          types: typeResult,
          suppliers: supplierResult,
          products: productResult,
          key: key,
          customer: undefined
        });
      }
    } catch (err) {
      console.error(err);
      res.render('search', {
        types: [],
        suppliers: [],
        products: [],
        key: req.query.search,
        customer: undefined
      });
    }
  }

  async getProductDefault(req, res, next) {
    try {
      const itemsPerPage = 12;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * itemsPerPage;
      
      // Lấy tổng số sản phẩm
      const totalCount = await product.countDocuments({});
      
      // Lấy sản phẩm phân trang (cần implement method findWithPagination trong product model)
      const result = await product.find({});
      const paginatedResult = result.slice(skip, skip + itemsPerPage);
      
      const [typeResult, supplierResult] = await Promise.all([
        type.find({}),
        supplier.find({})
      ]);

      if (req.isAuthenticated()) {
        const username = req.session.passport.user.username;
        const customerResult = await customers.findOne({ userName: username });
        res.render("product", {
          data: paginatedResult,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          message: req.flash('success'),
          customer: customerResult
        });
      } else {
        res.render("product", {
          data: paginatedResult,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          message: req.flash('success'),
          customer: undefined
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  async productAtPage(req, res, next) {
    try {
      const itemsPerPage = 12;
      const currentPage = parseInt(req.params.page) || 1;
      const skip = (currentPage - 1) * itemsPerPage;
      
      const totalCount = await product.countDocuments({});
      const result = await product.find({});
      const paginatedResult = result.slice(skip, skip + itemsPerPage);
      
      const [typeResult, supplierResult] = await Promise.all([
        type.find({}),
        supplier.find({})
      ]);

      if (req.isAuthenticated()) {
        const username = req.session.passport.user.username;
        const customerResult = await customers.findOne({ userName: username });
        res.render("product", {
          data: paginatedResult,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: currentPage,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          message: req.flash('success'),
          customer: customerResult
        });
      } else {
        res.render("product", {
          data: paginatedResult,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: currentPage,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          message: req.flash('success'),
          customer: undefined
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  async filterProduct(req, res, next) {
    try {
      const selection = req.body.selection;
      const supplierFilter = req.body.supplier;
      const minPrice = req.body.minPrice;
      const maxPrice = req.body.maxPrice;
      const rating = req.body.rating;
      const availability = req.body.availability;
      const sort = req.body.sort;
      
      req.session.selection = selection;
      req.session.supplierFilter = supplierFilter;
      
      const itemsPerPage = 12;
      const page = 1;
      
      // Build query object
      let query = {};
      
      if (selection && selection !== 'all') {
        query['description.typeCode'] = selection;
      }
      
      if (supplierFilter && supplierFilter !== 'all') {
        query['description.supplierCode'] = supplierFilter;
      }
      
      // Filter by price
      if (minPrice || maxPrice) {
        const allProducts = await product.find(query);
        const filteredProducts = allProducts.filter(p => {
          const price = p.description.price;
          if (minPrice && price < parseInt(minPrice)) return false;
          if (maxPrice && price > parseInt(maxPrice)) return false;
          return true;
        });
        
        // Apply other filters
        let finalProducts = filteredProducts;
        
        // Filter by rating
        if (rating) {
          const minRating = parseFloat(rating);
          finalProducts = finalProducts.filter(p => p.rating.average >= minRating);
        }
        
        // Filter by availability
        if (availability === 'in-stock') {
          finalProducts = finalProducts.filter(p => p.description.stock > 0);
        } else if (availability === 'out-of-stock') {
          finalProducts = finalProducts.filter(p => p.description.stock === 0);
        }
        
        // Sort options
        if (sort) {
          switch (sort) {
            case 'price-asc':
              finalProducts.sort((a, b) => a.description.price - b.description.price);
              break;
            case 'price-desc':
              finalProducts.sort((a, b) => b.description.price - a.description.price);
              break;
            case 'name-asc':
              finalProducts.sort((a, b) => a.productName.localeCompare(b.productName));
              break;
            case 'name-desc':
              finalProducts.sort((a, b) => b.productName.localeCompare(a.productName));
              break;
            case 'rating':
              finalProducts.sort((a, b) => b.rating.average - a.rating.average);
              break;
            case 'newest':
              finalProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              break;
          }
        }
        
        const [typeResult, supplierResult] = await Promise.all([
          type.find({}),
          supplier.find({})
        ]);

        if (req.isAuthenticated()) {
          const username = req.session.passport.user.username;
          const customerResult = await customers.findOne({ userName: username });
          res.render("product", {
            data: finalProducts,
            types: typeResult,
            suppliers: supplierResult,
            itemsPerPage: itemsPerPage,
            currentPage: page,
            totalProducts: finalProducts.length,
            totalPages: Math.ceil(finalProducts.length / itemsPerPage),
            message: req.flash('success'),
            customer: customerResult,
            selected: selection,
            supplierFilter: supplierFilter
          });
        } else {
          res.render("product", {
            data: finalProducts,
            types: typeResult,
            suppliers: supplierResult,
            itemsPerPage: itemsPerPage,
            currentPage: page,
            totalProducts: finalProducts.length,
            totalPages: Math.ceil(finalProducts.length / itemsPerPage),
            message: req.flash('success'),
            customer: undefined,
            selected: selection,
            supplierFilter: supplierFilter
          });
        }
        return;
      }
      
      // Nếu không có filter price, sử dụng query bình thường
      const result = await product.find(query);
      let filteredProducts = result;
      
      // Filter by rating
      if (rating) {
        const minRating = parseFloat(rating);
        filteredProducts = filteredProducts.filter(p => p.rating.average >= minRating);
      }
      
      // Filter by availability
      if (availability === 'in-stock') {
        filteredProducts = filteredProducts.filter(p => p.description.stock > 0);
      } else if (availability === 'out-of-stock') {
        filteredProducts = filteredProducts.filter(p => p.description.stock === 0);
      }
      
      // Sort options
      if (sort) {
        switch (sort) {
          case 'price-asc':
            filteredProducts.sort((a, b) => a.description.price - b.description.price);
            break;
          case 'price-desc':
            filteredProducts.sort((a, b) => b.description.price - a.description.price);
            break;
          case 'name-asc':
            filteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
            break;
          case 'name-desc':
            filteredProducts.sort((a, b) => b.productName.localeCompare(a.productName));
            break;
          case 'rating':
            filteredProducts.sort((a, b) => b.rating.average - a.rating.average);
            break;
          case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        }
      }
      
      const [typeResult, supplierResult] = await Promise.all([
        type.find({}),
        supplier.find({})
      ]);

      if (req.isAuthenticated()) {
        const username = req.session.passport.user.username;
        const customerResult = await customers.findOne({ userName: username });
        res.render("product", {
          data: filteredProducts,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          totalProducts: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / itemsPerPage),
          message: req.flash('success'),
          customer: customerResult,
          selected: selection,
          supplierFilter: supplierFilter
        });
      } else {
        res.render("product", {
          data: filteredProducts,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          totalProducts: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / itemsPerPage),
          message: req.flash('success'),
          customer: undefined,
          selected: selection,
          supplierFilter: supplierFilter
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  async filterProductAtPage(req, res, next) {
    try {
      const supplierFilter = req.session.supplierFilter;
      const selection = req.session.selection;
      const itemsPerPage = 6;
      const currentPage = req.params.page;
      
      let query = {};
      if (selection && selection !== 'all') {
        query['description.typeCode'] = selection;
      }
      
      const result = await product.find(query);
      const [typeResult, supplierResult] = await Promise.all([
        type.find({}),
        supplier.find({})
      ]);

      if (req.isAuthenticated()) {
        const username = req.session.passport.user.username;
        const customerResult = await customers.findOne({ userName: username });
        res.render("product-filter", {
          data: result,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: currentPage,
          message: req.flash('success'),
          customer: customerResult,
          selected: selection,
          supplierFilter: supplierFilter
        });
      } else {
        res.render("product-filter", {
          data: result,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: currentPage,
          message: req.flash('success'),
          customer: undefined,
          selected: selection,
          supplierFilter: supplierFilter
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  async filterProductGet(req, res, next) {
    try {
      const selection = req.query.category || req.session.selection;
      const supplierFilter = req.query.brand || req.session.supplierFilter;
      const minPrice = req.query.minPrice;
      const maxPrice = req.query.maxPrice;
      const rating = req.query.rating;
      const availability = req.query.availability;
      const sort = req.query.sort;
      
      const itemsPerPage = 12;
      const page = parseInt(req.query.page) || 1;
      
      // Build query object
      let query = {};
      
      if (selection && selection !== 'all') {
        query['description.typeCode'] = selection;
      }
      
      if (supplierFilter && supplierFilter !== 'all') {
        query['description.supplierCode'] = supplierFilter;
      }
      
      let result = await product.find(query);
      
      // Filter by price
      if (minPrice || maxPrice) {
        result = result.filter(p => {
          const price = p.description.price;
          if (minPrice && price < parseInt(minPrice)) return false;
          if (maxPrice && price > parseInt(maxPrice)) return false;
          return true;
        });
      }
      
      // Filter by rating
      if (rating) {
        const minRating = parseFloat(rating);
        result = result.filter(p => p.rating.average >= minRating);
      }
      
      // Filter by availability
      if (availability === 'in-stock') {
        result = result.filter(p => p.description.stock > 0);
      } else if (availability === 'out-of-stock') {
        result = result.filter(p => p.description.stock === 0);
      }
      
      // Sort options
      if (sort) {
        switch (sort) {
          case 'price-asc':
            result.sort((a, b) => a.description.price - b.description.price);
            break;
          case 'price-desc':
            result.sort((a, b) => b.description.price - a.description.price);
            break;
          case 'name-asc':
            result.sort((a, b) => a.productName.localeCompare(b.productName));
            break;
          case 'name-desc':
            result.sort((a, b) => b.productName.localeCompare(a.productName));
            break;
          case 'rating':
            result.sort((a, b) => b.rating.average - a.rating.average);
            break;
          case 'newest':
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        }
      }
      
      const totalCount = result.length;
      const paginatedResult = result.slice((page - 1) * itemsPerPage, page * itemsPerPage);
      
      const [typeResult, supplierResult] = await Promise.all([
        type.find({}),
        supplier.find({})
      ]);

      if (req.isAuthenticated()) {
        const username = req.session.passport.user.username;
        const customerResult = await customers.findOne({ userName: username });
        res.render("product", {
          data: paginatedResult,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          message: req.flash('success'),
          customer: customerResult,
          currentFilters: {
            category: selection,
            brand: supplierFilter,
            minPrice: minPrice,
            maxPrice: maxPrice,
            rating: rating,
            availability: availability,
            sort: sort
          }
        });
      } else {
        res.render("product", {
          data: paginatedResult,
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          totalProducts: totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          message: req.flash('success'),
          customer: undefined,
          currentFilters: {
            category: selection,
            brand: supplierFilter,
            minPrice: minPrice,
            maxPrice: maxPrice,
            rating: rating,
            availability: availability,
            sort: sort
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }
}

module.exports = new ProductController();