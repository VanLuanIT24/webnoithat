// controllers/ProductController.js
const product = require("../models/products");
const type = require("../models/types");
const supplier = require("../models/suppliers");
const customers = require("../models/customers");

class ProductController {
  productDetail(req, res, next) {
    var id = req.params.id;
    product.findOne({ _id: id }, (err, result) => {
      if(req.isAuthenticated()) {
        customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
          res.render("product-details", { data: result, customer: customerResult });
        });
      } else {
        res.render("product-details", { data: result, customer: undefined });
      }
    });
  }
  search(req, res, next) {
    var key = req.query.search;
    type.find({}, (err, typeResult) => {
      supplier.find({}, (err, supplierResult) => {
        product.find(
          { productName: { $regex: key, $options: 'i' } },
          (err, productResult) => {
           if(req.isAuthenticated()) {
             customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
              res.render('search', {
                types: typeResult,
                suppliers: supplierResult,
                products: productResult,
                key: key,
                customer: customerResult
              });
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
          }
        );
      });
    });
  }
  // controllers/ProductController.js
getProductDefault(req, res, next) {
    var itemsPerPage = 12; // Thay đổi từ 6 thành 12
    var page = parseInt(req.query.page) || 1;
    var skip = (page - 1) * itemsPerPage;
    
    product.find({})
        .skip(skip)
        .limit(itemsPerPage)
        .exec((err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Lỗi server');
            }
            
            product.countDocuments({}, (err, totalCount) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Lỗi server');
                }
                
                type.find({}, (err, data) => {
                    supplier.find({}, (err, supplierData) => {
                        if(req.isAuthenticated()) {
                            customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
                                res.render("product", {
                                    data: result,
                                    types: data,
                                    suppliers: supplierData,
                                    itemsPerPage: itemsPerPage,
                                    currentPage: page,
                                    totalProducts: totalCount,
                                    totalPages: Math.ceil(totalCount / itemsPerPage),
                                    message: req.flash('success'),
                                    customer: customerResult
                                });
                            });
                        } else {
                            res.render("product", {
                                data: result,
                                types: data,
                                suppliers: supplierData,
                                itemsPerPage: itemsPerPage,
                                currentPage: page,
                                totalProducts: totalCount,
                                totalPages: Math.ceil(totalCount / itemsPerPage),
                                message: req.flash('success'),
                                customer: undefined
                            });
                        }
                    });
                });
            });
        });
}

productAtPage(req, res, next) {
    var itemsPerPage = 12; // Thay đổi từ 6 thành 12
    var currentPage = parseInt(req.params.page) || 1;
    var skip = (currentPage - 1) * itemsPerPage;
    
    product.find({})
        .skip(skip)
        .limit(itemsPerPage)
        .exec((err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Lỗi server');
            }
            
            product.countDocuments({}, (err, totalCount) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Lỗi server');
                }
                
                type.find({}, (err, data) => {
                    supplier.find({}, (err, supplierData) => {
                        if(req.isAuthenticated()) {
                            customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
                                res.render("product", {
                                    data: result,
                                    types: data,
                                    suppliers: supplierData,
                                    itemsPerPage: itemsPerPage,
                                    currentPage: currentPage,
                                    totalProducts: totalCount,
                                    totalPages: Math.ceil(totalCount / itemsPerPage),
                                    message: req.flash('success'),
                                    customer: customerResult
                                });
                            });
                        } else {
                            res.render("product", {
                                data: result,
                                types: data,
                                suppliers: supplierData,
                                itemsPerPage: itemsPerPage,
                                currentPage: currentPage,
                                totalProducts: totalCount,
                                totalPages: Math.ceil(totalCount / itemsPerPage),
                                message: req.flash('success'),
                                customer: undefined
                            });
                        }
                    });
                });
            });
        });
}
  // Giữ nguyên method POST cũ nhưng cập nhật itemsPerPage
filterProduct(req, res, next) {
    var selection = req.body.selection;
    var supplierFilter = req.body.supplier;
    var minPrice = req.body.minPrice;
    var maxPrice = req.body.maxPrice;
    var rating = req.body.rating;
    var availability = req.body.availability;
    var sort = req.body.sort;
    
    req.session.selection = selection;
    req.session.supplierFilter = supplierFilter;
    
    var itemsPerPage = 12; // Cập nhật thành 12 sản phẩm mỗi trang
    var page = 1;
    
    // Build query object với các filter mới
    var query = {};
    
    if (selection && selection !== 'all') {
        query['description.typeCode'] = selection;
    }
    
    if (supplierFilter && supplierFilter !== 'all') {
        query['description.supplierCode'] = supplierFilter;
    }
    
    // Filter by price - THÊM MỚI
    if (minPrice || maxPrice) {
        query['description.price'] = {};
        if (minPrice) query['description.price'].$gte = parseInt(minPrice);
        if (maxPrice) query['description.price'].$lte = parseInt(maxPrice);
    }
    
    // Filter by rating - THÊM MỚI
    if (rating) {
        const minRating = parseFloat(rating);
        query['rating.average'] = { $gte: minRating };
    }
    
    // Filter by availability - THÊM MỚI
    if (availability === 'in-stock') {
        query['description.stock'] = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
        query['description.stock'] = 0;
    }
    
    // Sort options - THÊM MỚI
    var sortOptions = {};
    if (sort) {
        switch (sort) {
            case 'price-asc':
                sortOptions = { 'description.price': 1 };
                break;
            case 'price-desc':
                sortOptions = { 'description.price': -1 };
                break;
            case 'name-asc':
                sortOptions = { 'productName': 1 };
                break;
            case 'name-desc':
                sortOptions = { 'productName': -1 };
                break;
            case 'rating':
                sortOptions = { 'rating.average': -1 };
                break;
            case 'newest':
                sortOptions = { 'createdAt': -1 };
                break;
        }
    }
    
    // Đếm tổng số sản phẩm
    product.countDocuments(query, (err, totalCount) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Lỗi server');
        }
        
        // Lấy sản phẩm với phân trang
        product.find(query)
            .sort(sortOptions)
            .limit(itemsPerPage)
            .exec((err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Lỗi server');
                }
                
                type.find({}, (err, typesData) => {
                    supplier.find({}, (err, suppliersData) => {
                        if(req.isAuthenticated()) {
                            customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
                                res.render("product", {
                                    data: result,
                                    types: typesData,
                                    suppliers: suppliersData,
                                    itemsPerPage: itemsPerPage,
                                    currentPage: page,
                                    totalProducts: totalCount,
                                    totalPages: Math.ceil(totalCount / itemsPerPage),
                                    message: req.flash('success'),
                                    customer: customerResult,
                                    selected: selection,
                                    supplierFilter: supplierFilter
                                });
                            });
                        } else {
                            res.render("product", {
                                data: result,
                                types: typesData,
                                suppliers: suppliersData,
                                itemsPerPage: itemsPerPage,
                                currentPage: page,
                                totalProducts: totalCount,
                                totalPages: Math.ceil(totalCount / itemsPerPage),
                                message: req.flash('success'),
                                customer: undefined,
                                selected: selection,
                                supplierFilter: supplierFilter
                            });
                        }
                    });
                });
            });
    });
}
  filterProductAtPage(req, res, next) {
    var supplierFilter = req.session.supplierFilter;
    var selection = req.session.selection;
    var itemsPerPage = 6;
    var currentPage = req.params.page;
    if(selection) {
      product.find({'description.typeCode': selection}, (err, result) => {
        type.find({}, (err, data) => {
          supplier.find({}, (err, supplier) => {
            if(req.isAuthenticated()) {
              customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
                res.render("product-filter", {
                  data: result,
                  types: data,
                  suppliers: supplier,
                  itemsPerPage: itemsPerPage,
                  currentPage: currentPage,
                  message: req.flash('success'),
                  customer: customerResult,
                  selected: selection,
                  supplierFilter: supplierFilter
                });
              })
            } else {
              res.render("product-filter", {
                data: result,
                types: data,
                suppliers: supplier,
                itemsPerPage: itemsPerPage,
                currentPage: currentPage,
                message: req.flash('success'),
                customer: undefined,
                selected: selection,
                supplierFilter: supplierFilter
              });
            }
          });
        });
      });
    } else {
      product.find({}, (err, result) => {
        type.find({}, (err, data) => {
          supplier.find({}, (err, supplier) => {
            if(req.isAuthenticated()) {
              customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
                res.render("product-filter", {
                  data: result,
                  types: data,
                  suppliers: supplier,
                  itemsPerPage: itemsPerPage,
                  currentPage: currentPage,
                  message: req.flash('success'),
                  customer: customerResult,
                  selected: selection,
                  supplierFilter: supplierFilter
                });
              })
            } else {
              res.render("product-filter", {
                data: result,
                types: data,
                suppliers: supplier,
                itemsPerPage: itemsPerPage,
                currentPage: currentPage,
                message: req.flash('success'),
                customer: undefined,
                selected: selection,
                supplierFilter: supplierFilter
              });
            }
          });
        });
      });
    }
  }

  // Thêm method mới cho GET requests
filterProductGet(req, res, next) {
    var selection = req.query.category || req.session.selection;
    var supplierFilter = req.query.brand || req.session.supplierFilter;
    var minPrice = req.query.minPrice;
    var maxPrice = req.query.maxPrice;
    var rating = req.query.rating;
    var availability = req.query.availability;
    var sort = req.query.sort;
    
    var itemsPerPage = 12; // Tăng lên 12 sản phẩm
    var page = parseInt(req.query.page) || 1;
    var skip = (page - 1) * itemsPerPage;
    
    // Build query object
    var query = {};
    
    if (selection && selection !== 'all') {
        query['description.typeCode'] = selection;
    }
    
    if (supplierFilter && supplierFilter !== 'all') {
        query['description.supplierCode'] = supplierFilter;
    }
    
    // Filter by price
    if (minPrice || maxPrice) {
        query['description.price'] = {};
        if (minPrice) query['description.price'].$gte = parseInt(minPrice);
        if (maxPrice) query['description.price'].$lte = parseInt(maxPrice);
    }
    
    // Filter by rating
    if (rating) {
        const minRating = parseFloat(rating);
        query['rating.average'] = { $gte: minRating };
    }
    
    // Filter by availability
    if (availability === 'in-stock') {
        query['description.stock'] = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
        query['description.stock'] = 0;
    }
    
    // Sort options
    var sortOptions = {};
    if (sort) {
        switch (sort) {
            case 'price-asc':
                sortOptions = { 'description.price': 1 };
                break;
            case 'price-desc':
                sortOptions = { 'description.price': -1 };
                break;
            case 'name-asc':
                sortOptions = { 'productName': 1 };
                break;
            case 'name-desc':
                sortOptions = { 'productName': -1 };
                break;
            case 'rating':
                sortOptions = { 'rating.average': -1 };
                break;
            case 'newest':
                sortOptions = { 'createdAt': -1 };
                break;
            default:
                sortOptions = {};
        }
    }
    
    // Lấy tổng số sản phẩm và sản phẩm phân trang
    product.countDocuments(query, (err, totalCount) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Lỗi server');
        }
        
        product.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(itemsPerPage)
            .exec((err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Lỗi server');
                }
                
                type.find({}, (err, typesData) => {
                    supplier.find({}, (err, suppliersData) => {
                        if(req.isAuthenticated()) {
                            customers.findOne({'loginInformation.userName': req.session.passport.user.username}, (err, customerResult) => {
                                res.render("product", {
                                    data: result,
                                    types: typesData,
                                    suppliers: suppliersData,
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
                            });
                        } else {
                            res.render("product", {
                                data: result,
                                types: typesData,
                                suppliers: suppliersData,
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
                    });
                });
            });
    });
}

}

module.exports = new ProductController();
