// controllers/AdminController.js
const type = require("../models/types");
const supplier = require("../models/suppliers");
const product = require("../models/products");
const admin = require("../models/admin");
const bill = require('../models/bills');
const region = require("../models/region");
const customers = require("../models/customers");
class AdminController {
  // controllers/productController.js

getLoginPage(req, res, next) {
  res.render("login", { message: req.flash("error") });
}

getDashboardPage(req, res, next) {
  if (req.isAuthenticated()) {
    product.find({}, (err, productResult) => {
      bill.find({}, (err, billResult) => {
        admin.findOne(
          { "loginInformation.userName": req.session.passport.user.username },
          (err, customerResult) => {
            res.render("dashboard", {
              message: req.flash("success"),
              customer: customerResult,
              abc: billResult,
              products: productResult
            });
          }
        );
      });
    })
  } else {
    res.redirect("/admin/login");
  }
}

getProductManagerAtPage(req, res, next) {
  if (req.isAuthenticated()) {
    const numberItemPerpage = 12;
    const page = req.params.page;
    
    product.find({})
      .then(productResult => {
        return Promise.all([
          productResult,
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
          supplier.find({}),
          type.find({})
        ]);
      })
      .then(([productResult, resultCustomer, supplierResult, typeResult]) => {
        res.render("products-manager", {
          products: productResult,
          customer: resultCustomer,
          types: typeResult,
          suppliers: supplierResult,
          message: req.flash("success"),
          page: page,
          numberItemPerpage: numberItemPerpage,
        });
      })
      .catch(err => {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý sản phẩm!");
        res.redirect("/admin/dashboard");
      });
  } else {
    res.redirect("/admin/login");
  }
}

getAddProductPage(req, res, next) {
  if (req.isAuthenticated()) {
    Promise.all([
      supplier.find({}),
      type.find({}),
      admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
    ])
    .then(([supplierResult, typeResult, customerResult]) => {
      res.render("add-product", {
        suppliers: supplierResult,
        types: typeResult,
        customer: customerResult,
        message: "",
      });
    })
    .catch(err => {
      console.error(err);
      req.flash("error", "Có lỗi xảy ra khi tải trang thêm sản phẩm!");
      res.redirect("/admin/dashboard/products-manager");
    });
  } else {
    res.redirect("/admin/login");
  }
}


postAddProduct(req, res, next) {
  if (req.isAuthenticated()) {
    try {
      const data = {
        productName: req.body.productname,
        description: {
          imageList: req.files ? req.files.map((image) => `/${image.path}`) : [],
          productDescription: req.body.description || "",
          price: parseFloat(req.body.price) || 0,
          supplierCode: req.body.supplier || "",
          typeCode: req.body.categories || "",
          status: req.body.status === 'true',
          unit: req.body.unit || "Cái",
          stock: parseInt(req.body.stock) || 0,
          featured: req.body.featured === 'on',
          inStock: req.body.inStock !== 'false'
        },
        discount: {
          type: req.body.discountType || "none",
          value: req.body.discountValue ? parseFloat(req.body.discountValue) : 0,
          endDate: req.body.discountEndDate ? new Date(req.body.discountEndDate) : null
        },
        rating: {
          average: 0,
          count: 0,
          distribution: [0, 0, 0, 0, 0]
        }
      };

      // Xử lý discount nếu là none
      if (data.discount.type === 'none') {
        data.discount.value = 0;
        data.discount.endDate = null;
      }

      const newProduct = new product(data);
      
      newProduct.save()
        .then(() => {
          req.flash("success", "Thêm sản phẩm thành công!");
          res.redirect("/admin/dashboard/products-manager/");
        })
        .catch((err) => {
          console.error("Lỗi khi lưu sản phẩm:", err);
          req.flash("error", "Có lỗi xảy ra trong quá trình thêm sản phẩm!");
          res.redirect("/admin/dashboard/products-manager/add");
        });
    } catch (error) {
      console.error("Lỗi khi xử lý dữ liệu:", error);
      req.flash("error", "Dữ liệu không hợp lệ!");
      res.redirect("/admin/dashboard/products-manager/add");
    }
  } else {
    res.redirect("/admin/login");
  }
}

getProductManagerPage(req, res, next) {
  if (req.isAuthenticated()) {
    const numberItemPerpage = 12;
    
    Promise.all([
      product.find({}),
      admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
      supplier.find({}),
      type.find({})
    ])
    .then(([productResult, resultCustomer, supplierResult, typeResult]) => {
      res.render("products-manager", {
        products: productResult,
        customer: resultCustomer,
        types: typeResult,
        suppliers: supplierResult,
        message: req.flash("success"),
        page: 1,
        numberItemPerpage: numberItemPerpage,
      });
    })
    .catch(err => {
      console.error(err);
      req.flash("error", "Có lỗi xảy ra khi tải trang quản lý sản phẩm!");
      res.redirect("/admin/dashboard");
    });
  } else {
    res.redirect("/admin/login");
  }
}

getHideProductInfo(req, res, next) {
  if (req.isAuthenticated()) {
    const idProduct = req.params.id;
    
    product.findOne({ _id: idProduct })
      .then(productResult => {
        if (!productResult) {
          req.flash("error", "Không tìm thấy sản phẩm!");
          return res.redirect("/admin/dashboard/products-manager");
        }
        
        return product.findOneAndUpdate(
          { _id: idProduct },
          { "description.status": !productResult.description.status },
          { new: true }
        );
      })
      .then(() => {
        req.flash("success", "Ẩn/Hiển thị thông tin thành công!");
        res.redirect("/admin/dashboard/products-manager");
      })
      .catch((err) => {
        console.error(err);
        req.flash("error", "Ẩn/Hiển thị thông tin không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/products-manager");
      });
  } else {
    res.redirect("/admin/login");
  }
}

getDeleteProductInfo(req, res, next) {
  if (req.isAuthenticated()) {
    const idProduct = req.params.id;
    
    product.findOneAndDelete({ _id: idProduct })
      .then((result) => {
        if (!result) {
          req.flash("error", "Không tìm thấy sản phẩm để xóa!");
          return res.redirect("/admin/dashboard/products-manager");
        }
        req.flash("success", "Xóa thông tin thành công!");
        res.redirect("/admin/dashboard/products-manager");
      })
      .catch((err) => {
        console.error(err);
        req.flash("error", "Xóa thông tin không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/products-manager");
      });
  } else {
    res.redirect("/admin/login");
  }
}

getUpdateProductPage(req, res, next) {
  if (req.isAuthenticated()) {
    const idProduct = req.params.id;
    
    Promise.all([
      product.findOne({ _id: idProduct }),
      type.find({}),
      supplier.find({}),
      admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
    ])
    .then(([productResult, typeResult, supplierResult, customerResult]) => {
      if (!productResult) {
        req.flash("error", "Không tìm thấy sản phẩm!");
        return res.redirect("/admin/dashboard/products-manager");
      }
      
      res.render("update-product", {
        customer: customerResult,
        product: productResult,
        types: typeResult,
        suppliers: supplierResult,
      });
    })
    .catch(err => {
      console.error(err);
      req.flash("error", "Có lỗi xảy ra khi tải trang cập nhật sản phẩm!");
      res.redirect("/admin/dashboard/products-manager");
    });
  } else {
    res.redirect("/admin/login");
  }
}

postUpdateProductPage(req, res, next) {
  if (req.isAuthenticated()) {
    const idProduct = req.params.id;
    
    product.findOne({ _id: idProduct })
      .then(productResult => {
        if (!productResult) {
          req.flash("error", "Không tìm thấy sản phẩm!");
          return res.redirect("/admin/dashboard/products-manager");
        }

        // Xử lý ảnh
        let imageList = productResult.description.imageList || [];
        
        if (req.files && req.files.length > 0) {
          // Có ảnh mới upload
          imageList = req.files.map((img) => `/${img.path}`);
        } else if (req.body.removeImages && req.body.removeImages.length > 0) {
          // Xóa ảnh được chọn
          imageList = imageList.filter(img => !req.body.removeImages.includes(img));
        }

        // Xử lý discount
        const discountData = {
          type: req.body.discountType || "none",
          value: req.body.discountValue ? parseFloat(req.body.discountValue) : 0,
          endDate: req.body.discountEndDate ? new Date(req.body.discountEndDate) : null
        };

        // Xử lý rating
        const ratingData = {
          average: req.body.averageRating ? parseFloat(req.body.averageRating) : productResult.rating.average,
          count: req.body.reviewCount ? parseInt(req.body.reviewCount) : productResult.rating.count,
          distribution: productResult.rating.distribution || [0, 0, 0, 0, 0]
        };

        // Xử lý rating distribution nếu có
        if (req.body.ratingDistribution) {
          ratingData.distribution = req.body.ratingDistribution.split(',').map(num => parseInt(num.trim()));
        }

        // Dữ liệu cập nhật
        const updateData = {
          productName: req.body.productname,
          description: {
            imageList: imageList,
            productDescription: req.body.description || "",
            price: parseFloat(req.body.price) || 0,
            supplierCode: req.body.supplier || "",
            typeCode: req.body.categories || "",
            status: req.body.status === 'true',
            unit: req.body.unit || "Cái",
            stock: parseInt(req.body.stock) || 0,
            featured: req.body.featured === 'on',
            inStock: req.body.inStock !== 'false'
          },
          discount: discountData,
          rating: ratingData
        };

        return product.findOneAndUpdate(
          { _id: idProduct }, 
          updateData, 
          { new: true, runValidators: true }
        );
      })
      .then(() => {
        req.flash("success", "Cập nhật thông tin thành công!");
        res.redirect("/admin/dashboard/products-manager");
      })
      .catch((err) => {
        console.error(err);
        req.flash("error", "Cập nhật thông tin không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/products-manager/update/" + idProduct);
      });
  } else {
    res.redirect("/admin/login");
  }
}

  getCategoriesManagerPage(req, res, next) {
    var numberItemPerpage = 6;
    if(req.isAuthenticated()) {
      admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
        type.find({}, (err, typeResult) => {
          res.render('categories-manager', {
            customer: customerResult,
            categories: typeResult,
            page: 1,
            numberItemPerpage: numberItemPerpage,
            message: req.flash("success")
          });
        });
      });
    } else {
      res.redirect('/admin/login');
    }
  }
  getCategoriesManagerAtPage(req, res, next) {
    if(req.isAuthenticated()) {
      var numberItemPerpage = 6;
      var page = req.params.page;
      admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
        type.find({}, (err, typeResult) => {
          res.render('categories-manager', {
            customer: customerResult,
            categories: typeResult,
            page: page,
            numberItemPerpage: numberItemPerpage,
            message: req.flash("success")
          });
        });
      });
    } else {
      res.redirect('/admin/login');
    }
  }
  getUpdateCategoriesPage(req, res, next) {
    if(req.isAuthenticated()) {
      var id = req.params.id;
      type.findOne({_id: id}, (err, typeResult) => {
        admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
          res.render('update-categories', {type: typeResult, customer: customerResult});
        });
      });
    } else {
      res.redirect('/admin/login');
    }
  }
  getAddCategoriesPage(req, res, next) {
    if(req.isAuthenticated()) {
      admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
        res.render('add-categories', {customer: customerResult});
      });
    } else {
      res.redirect('/admin/login');
    }
  }
  postAddCategories(req, res, next) {
    if(req.isAuthenticated()) {
      var data = {
        'typeName': req.body.name,
        'thumbnail': `/${req.file.path}`,
        'status': req.body.status === 'on' || req.body.status === 'true'  // <-- SỬA Ở ĐÂY
      }
      var newCategories = new type(data);
      newCategories.save()
      .then(() => {
        req.flash('success', 'Thêm danh mục thành công!');
        res.redirect('/admin/dashboard/categories-manager/');
      })
      .catch((err) => {
        console.log(err);
        req.flash('error', 'Thêm danh mục không thành công! Có lỗi xảy ra!');
      });
    } else {
      res.redirect('/admin/login');
    }
}
getUpdateCategoriesPage(req, res, next) {
    if(req.isAuthenticated()) {
      var id = req.params.id;
      type.findOne({_id: id}, (err, typeResult) => {
        if (err) {
          req.flash('error', 'Không tìm thấy danh mục!');
          return res.redirect('/admin/dashboard/categories-manager');
        }
        admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
          res.render('update-categories', {
            type: typeResult, 
            customer: customerResult,
            message: req.flash("success") || req.flash("error") || ''
          });
        });
      });
    } else {
      res.redirect('/admin/login');
    }
}

postUpdateCategoriesPage(req, res, next) {
    if (req.isAuthenticated()) {
        var id = req.params.id;
        type.findOne({ _id: id }, (err, typeResult) => {
            if (err) {
                req.flash("error", "Không tìm thấy danh mục!");
                return res.redirect("/admin/dashboard/categories-manager");
            }
            
            var data = {
                typeName: req.body.name,
                thumbnail: req.file ? `/${req.file.path}` : typeResult.thumbnail,
                status: req.body.status === 'on' || req.body.status === 'true'
            };
            
            type.findOneAndUpdate({ _id: id }, data, { new: true })
                .then(() => {
                    req.flash("success", "Cập nhật thông tin danh mục thành công!");
                    res.redirect("/admin/dashboard/categories-manager");
                })
                .catch((err) => {
                    console.log(err);
                    req.flash("error", "Cập nhật thông tin danh mục không thành công! Có lỗi xảy ra!");
                    res.redirect("/admin/dashboard/categories-manager/update/" + id);
                });
        });
    } else {
        res.redirect("/admin/login");
    }
}

  getDeleteCategoriesInfo(req, res, next) {
    if (req.isAuthenticated()) {
      var id = req.params.id;
      type.findOneAndRemove({ _id: id }, (err, result) => {
        if (err) {
          console.log(err);
          req.flash("error", "Xóa danh mục không thành công! Có lỗi xảy ra!");
          next();
        }
        req.flash("success", "Xóa danh mục thành công!");
        res.redirect("/admin/dashboard/categories-manager");
      });
    } else {
      res.redirect("/admin/login");
    }
  }
  getOrdersManagerPage(req, res, next) {
    var numberItemPerpage = 6;
    if(req.isAuthenticated()) {
      admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
        bill.find({status: {$nin: ['Chờ xác nhận']}}, (err, billResult) => {
          res.render('orders-manager', {
            customer: customerResult,
            bills: billResult,
            page: 1,
            numberItemPerpage: numberItemPerpage,
            message: req.flash("success")
          });
        });
      });
    } else {
      res.redirect('/admin/login');
    }
  }
  getPendingOrderPage(req, res, next) {
    var numberItemPerpage = 6;
    if(req.isAuthenticated()) {
      admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
        bill.find({status: 'Chờ xác nhận'}, (err, billResult) => {
          res.render('pending-order', {
            customer: customerResult,
            bills: billResult,
            page: 1,
            numberItemPerpage: numberItemPerpage,
            message: req.flash("success")
          });
        });
      });
    } else {
      res.redirect('/admin/login');
    }
  }
  
  getPendingOrderAtPage(req, res, next) {
    var numberItemPerpage = 6;
    var page = req.params.page;
    if(req.isAuthenticated()) {
      admin.findOne({"loginInformation.userName": req.session.passport.user.username}, (err, customerResult) => {
        bill.find({status: 'Chờ xác nhận'}, (err, billResult) => {
          res.render('pending-order', {
            customer: customerResult,
            bills: billResult,
            page: page,
            numberItemPerpage: numberItemPerpage,
            message: req.flash("success")
          });
        });
      });
    } else {
      res.redirect('/admin/login');
    }
  }
  getUpdateStatusOrder(req, res, next) {
    var id = req.params.id;
    var data = {status: 'Chuẩn bị hàng'}
    bill.findOneAndUpdate({_id: id}, data, {new: true})
    .then(() => {
      req.flash("success", "Đã xác nhận đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Lỗi xác nhận đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    });
  }
  getDeleteStatusOrder(req, res, next) {
    var id = req.params.id;
    var data = {status: 'Đã hủy'}
    bill.findOneAndUpdate({_id: id}, data, {new: true})
    .then(() => {
      req.flash("success", "Đã hủy đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Lỗi hủy đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    });
  }
  getUpdateAllStatusOrder(req, res, next) {
    var data = {status: 'Chuẩn bị hàng'}
    bill.updateMany({}, {$set: data}, {new: true})
    .then(() => {
      req.flash("success", "Đã xác nhận đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Lỗi xác nhận đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    });
  }
  getUpdateOrder(req, res, next) {
    var id = req.params.id;
    var user = req.session.passport.user.username;
    admin.findOne({'loginInformation.userName': user}, (err, customerResult) => {
      bill.findOne({_id: id}, (err, billResult) => {
        if (err) {
          console.log(err);
          req.flash("error", "Lỗi tải thông tin đơn hàng!");
          return res.redirect('/admin/dashboard/orders-manager');
        }
        
        if (!billResult) {
          req.flash("error", "Đơn hàng không tồn tại!");
          return res.redirect('/admin/dashboard/orders-manager');
        }
        
        res.render('update-order', {
          customer: customerResult, 
          bill: billResult,
          message: req.flash("success")
        });
      });
    });
}

postUpdateOrder(req, res, next) {
    var id = req.params.id;
    var fullName = req.body.name;
    var lastIndexSpace = fullName.lastIndexOf(' ');
    var firstName = fullName.slice(0, lastIndexSpace);
    var lastName = fullName.slice(lastIndexSpace + 1, fullName.length);
    var city = req.body.city;
    var district = req.body.district;
    var ward = req.body.ward;
    var address = req.body.address;
    var status = req.body.status;
    
    region.findOne({Id: city}, (err, cityResult) => {
      if (err || !cityResult) {
        console.log(err);
        req.flash('error', 'Lỗi xác thực địa chỉ!');
        return res.redirect('/admin/dashboard/orders-manager/update/' + id);
      }
      
      var districtData = cityResult.Districts.filter(e => e.Id == district);
      var districtName = districtData[0]?.Name || '';
      var wardName = districtData[0]?.Wards.filter(e => e.Id == ward)[0]?.Name || '';
      
      var data = {
        'displayName': {firstName: firstName, lastName: lastName},
        'address': `${address}, ${wardName}, ${districtName}, ${cityResult.Name}`,
        'status': status
      }
      
      bill.findOneAndUpdate({_id: id}, {$set: data}, {new: true})
      .then(() => {
        // Xóa bản nháp sau khi cập nhật thành công
        // localStorage.removeItem('orderDraft_' + id);
        
        req.flash('success', 'Cập nhật thông tin đơn hàng thành công!');
        res.redirect('/admin/dashboard/orders-manager');
      })
      .catch((err) => {
        console.log(err);
        req.flash('error', 'Cập nhật thông tin đơn hàng không thành công!');
        res.redirect('/admin/dashboard/orders-manager/update/' + id);
      });
    });
}
  getDeleteOrder(req, res, next) {
    var id = req.params.id;
    var data = {status: 'Đã hủy'}
    bill.findOneAndUpdate({_id: id}, data, {new: true})
    .then(() => {
      req.flash("success", "Đã hủy đơn hàng!");
      res.redirect('/admin/dashboard/orders-manager');
    })
    .catch((err) => {
      console.log(err);
      req.flash("error", "Lỗi hủy đơn hàng!");
      res.redirect('/admin/dashboard/orders-manager');
    });
  }

  // Xem chi tiết đơn hàng
getOrderDetail(req, res, next) {
  var id = req.params.id;
  var user = req.session.passport.user.username;
  
  if(req.isAuthenticated()) {
    admin.findOne({'loginInformation.userName': user}, (err, customerResult) => {
      bill.findOne({_id: id})
        .populate('userID') // Nếu có liên kết với user
        .exec((err, billResult) => {
          if (err) {
            console.log(err);
            req.flash("error", "Lỗi tải thông tin đơn hàng!");
            return res.redirect('back');
          }
          
          if (!billResult) {
            req.flash("error", "Đơn hàng không tồn tại!");
            return res.redirect('back');
          }
          
          // Tính tổng tiền
          let totalAmount = 0;
          let totalProducts = 0;
          billResult.listProduct.forEach(product => {
            totalAmount += parseInt(product.productPrice) * product.amount;
            totalProducts += parseInt(product.amount);
          });
          
          res.render('order-detail', {
            customer: customerResult,
            bill: billResult,
            totalAmount: totalAmount,
            totalProducts: totalProducts,
            message: req.flash("success")
          });
        });
    });
  } else {
    res.redirect('/admin/login');
  }
}

getLogout(req, res, next) {
  req.logout();
  res.redirect('/admin/login');
}


// Quản lý người dùng
getUsersManagerPage(req, res, next) {
  if (req.isAuthenticated()) {
    const numberItemPerpage = 10;
    
    Promise.all([
      customers.find({}),
      admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
    ])
    .then(([usersResult, customerResult]) => {
      res.render("users-manager", {
        users: usersResult,
        customer: customerResult,
        message: req.flash("success"),
        page: 1,
        numberItemPerpage: numberItemPerpage,
      });
    })
    .catch(err => {
      console.error(err);
      req.flash("error", "Có lỗi xảy ra khi tải trang quản lý người dùng!");
      res.redirect("/admin/dashboard");
    });
  } else {
    res.redirect("/admin/login");
  }
}

getUsersManagerAtPage(req, res, next) {
  if (req.isAuthenticated()) {
    const numberItemPerpage = 10;
    const page = req.params.page;
    
    Promise.all([
      customers.find({}),
      admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
    ])
    .then(([usersResult, customerResult]) => {
      res.render("users-manager", {
        users: usersResult,
        customer: customerResult,
        message: req.flash("success"),
        page: page,
        numberItemPerpage: numberItemPerpage,
      });
    })
    .catch(err => {
      console.error(err);
      req.flash("error", "Có lỗi xảy ra khi tải trang quản lý người dùng!");
      res.redirect("/admin/dashboard");
    });
  } else {
    res.redirect("/admin/login");
  }
}

getUpdateUserPage(req, res, next) {
  if (req.isAuthenticated()) {
    const userId = req.params.id;
    
    Promise.all([
      customers.findOne({ _id: userId }),
      admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
    ])
    .then(([userResult, customerResult]) => {
      if (!userResult) {
        req.flash("error", "Không tìm thấy người dùng!");
        return res.redirect("/admin/dashboard/users-manager");
      }
      
      res.render("update-user", {
        customer: customerResult,
        user: userResult,
        message: req.flash("success") || req.flash("error") || ''
      });
    })
    .catch(err => {
      console.error(err);
      req.flash("error", "Có lỗi xảy ra khi tải trang cập nhật người dùng!");
      res.redirect("/admin/dashboard/users-manager");
    });
  } else {
    res.redirect("/admin/login");
  }
}

postUpdateUserPage(req, res, next) {
  if (req.isAuthenticated()) {
    const userId = req.params.id;
    
    console.log('Request body:', req.body); // Debug
    console.log('Request file:', req.file); // Debug
    
    customers.findOne({ _id: userId })
      .then(userResult => {
        if (!userResult) {
          req.flash("error", "Không tìm thấy người dùng!");
          return res.redirect("/admin/dashboard/users-manager");
        }

        // Tạo object update data
        const updateData = {
          'fullNameCustomer.firstName': req.body.firstname,
          'fullNameCustomer.lastName': req.body.lastname,
          dateOfBirth: req.body.dateOfBirth,
          sex: req.body.sex,
          identityCardNumber: req.body.identityCardNumber,
          address: req.body.address,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email,
          updatedAt: new Date()
        };

        // Xử lý avatar nếu có file upload
        if (req.file) {
          updateData.avatar = `/uploads/${req.file.filename}`;
          console.log('New avatar path:', updateData.avatar); // Debug
        }

        // Xử lý mật khẩu nếu có
        if (req.body.password && req.body.password.trim() !== '') {
          updateData['loginInformation.password'] = req.body.password;
        }

        console.log('Final update data:', updateData); // Debug

        return customers.findOneAndUpdate(
          { _id: userId }, 
          { $set: updateData }, 
          { new: true }
        );
      })
      .then((updatedUser) => {
        console.log('User updated successfully:', updatedUser); // Debug
        req.flash("success", "Cập nhật thông tin người dùng thành công!");
        res.redirect("/admin/dashboard/users-manager");
      })
      .catch((err) => {
        console.error("Lỗi khi cập nhật:", err);
        req.flash("error", "Cập nhật thông tin người dùng không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/users-manager/update/" + userId);
      });
  } else {
    res.redirect("/admin/login");
  }
}

getDeleteUserInfo(req, res, next) {
  if (req.isAuthenticated()) {
    const userId = req.params.id;
    
    customers.findOneAndDelete({ _id: userId })
      .then((result) => {
        if (!result) {
          req.flash("error", "Không tìm thấy người dùng để xóa!");
          return res.redirect("/admin/dashboard/users-manager");
        }
        req.flash("success", "Xóa người dùng thành công!");
        res.redirect("/admin/dashboard/users-manager");
      })
      .catch((err) => {
        console.error(err);
        req.flash("error", "Xóa người dùng không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/users-manager");
      });
  } else {
    res.redirect("/admin/login");
  }
}

getBlockUserInfo(req, res, next) {
  if (req.isAuthenticated()) {
    const userId = req.params.id;
    
    customers.findOne({ _id: userId })
      .then(userResult => {
        if (!userResult) {
          req.flash("error", "Không tìm thấy người dùng!");
          return res.redirect("/admin/dashboard/users-manager");
        }
        
        const newStatus = !userResult.loginInformation.status;
        
        return customers.findOneAndUpdate(
          { _id: userId },
          { "loginInformation.status": newStatus },
          { new: true }
        );
      })
      .then(() => {
        req.flash("success", "Khóa/Mở khóa người dùng thành công!");
        res.redirect("/admin/dashboard/users-manager");
      })
      .catch((err) => {
        console.error(err);
        req.flash("error", "Khóa/Mở khóa người dùng không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/users-manager");
      });
  } else {
    res.redirect("/admin/login");
  }
}

// Trang thông tin tài khoản
getAccountPage(req, res, next) {
  if (req.isAuthenticated()) {
    admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
      .then(customerResult => {
        if (!customerResult) {
          req.flash("error", "Không tìm thấy thông tin tài khoản!");
          return res.redirect("/admin/dashboard");
        }
        
        res.render("account", {
          customer: customerResult,
          message: req.flash("success") || req.flash("error") || ''
        });
      })
      .catch(err => {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang thông tin tài khoản!");
        res.redirect("/admin/dashboard");
      });
  } else {
    res.redirect("/admin/login");
  }
}

// Cập nhật thông tin tài khoản
postUpdateAccount(req, res, next) {
  if (req.isAuthenticated()) {
    const username = req.session.passport.user.username;
    
    // Validation cơ bản
    const { firstname, lastname, email, phoneNumber } = req.body;
    if (!firstname || !lastname || !email || !phoneNumber) {
      req.flash("error", "Vui lòng điền đầy đủ thông tin bắt buộc!");
      return res.redirect("/admin/dashboard/account");
    }

    admin.findOne({ "loginInformation.userName": username })
      .then(adminResult => {
        if (!adminResult) {
          req.flash("error", "Không tìm thấy tài khoản!");
          return res.redirect("/admin/dashboard/account");
        }

        // Tạo object update data
        const updateData = {
          'fullNameCustomer.firstName': firstname,
          'fullNameCustomer.lastName': lastname,
          dateOfBirth: req.body.dateOfBirth,
          sex: req.body.sex,
          identityCardNumber: req.body.identityCardNumber,
          address: req.body.address,
          phoneNumber: phoneNumber,
          email: email,
          updatedAt: new Date()
        };

        // Xử lý avatar nếu có file upload
        if (req.file) {
          updateData.avatar = `/uploads/${req.file.filename}`;
          console.log('Avatar updated:', updateData.avatar);
        }

        return admin.findOneAndUpdate(
          { "loginInformation.userName": username }, 
          { $set: updateData }, 
          { new: true, runValidators: true }
        );
      })
      .then((updatedAdmin) => {
        console.log('Admin updated successfully:', updatedAdmin);
        req.flash("success", "Cập nhật thông tin tài khoản thành công!");
        res.redirect("/admin/dashboard/account");
      })
      .catch((err) => {
        console.error("Lỗi khi cập nhật:", err);
        req.flash("error", "Cập nhật thông tin tài khoản không thành công: " + err.message);
        res.redirect("/admin/dashboard/account");
      });
  } else {
    res.redirect("/admin/login");
  }
}

// Đổi mật khẩu
postChangePassword(req, res, next) {
  if (req.isAuthenticated()) {
    const username = req.session.passport.user.username;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Kiểm tra mật khẩu mới
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash("error", "Vui lòng điền đầy đủ thông tin mật khẩu!");
      return res.redirect("/admin/dashboard/account");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error", "Mật khẩu mới không khớp!");
      return res.redirect("/admin/dashboard/account");
    }

    if (newPassword.length < 6) {
      req.flash("error", "Mật khẩu phải có ít nhất 6 ký tự!");
      return res.redirect("/admin/dashboard/account");
    }

    admin.findOne({ "loginInformation.userName": username })
      .then(adminResult => {
        if (!adminResult) {
          req.flash("error", "Không tìm thấy tài khoản!");
          return res.redirect("/admin/dashboard/account");
        }

        // Kiểm tra mật khẩu hiện tại
        // LƯU Ý: Trong thực tế, bạn nên sử dụng bcrypt để so sánh mật khẩu
        if (adminResult.loginInformation.password !== currentPassword) {
          req.flash("error", "Mật khẩu hiện tại không đúng!");
          return res.redirect("/admin/dashboard/account");
        }

        // Cập nhật mật khẩu mới
        return admin.findOneAndUpdate(
          { "loginInformation.userName": username }, 
          { 
            $set: { 
              "loginInformation.password": newPassword,
              updatedAt: new Date()
            } 
          }, 
          { new: true }
        );
      })
      .then(() => {
        req.flash("success", "Đổi mật khẩu thành công!");
        res.redirect("/admin/dashboard/account");
      })
      .catch((err) => {
        console.error("Lỗi khi đổi mật khẩu:", err);
        req.flash("error", "Đổi mật khẩu không thành công!");
        res.redirect("/admin/dashboard/account");
      });
  } else {
    res.redirect("/admin/login");
  }
}
}


module.exports = new AdminController();
