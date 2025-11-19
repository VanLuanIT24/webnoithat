// controllers/AdminController.js
const type = require("../models-mysql/types");
const supplier = require("../models-mysql/suppliers");
const product = require("../models-mysql/products");
const admin = require("../models-mysql/admins");
const bill = require('../models-mysql/bills');
const region = require("../models-mysql/regions");
const customers = require("../models-mysql/customers");

class AdminController {
  // controllers/productController.js

  getLoginPage(req, res, next) {
    res.render("login", { message: req.flash("error") });
  }

  // controllers/AdminController.js - Sửa hàm getDashboardPage
async getDashboardPage(req, res, next) {
  try {
    if (req.isAuthenticated() && req.user) {
      const username = req.user.loginInformation?.userName;
      
      // SỬA: Dùng biến 'admin' đã import thay vì 'admins'
      const adminResult = await admin.findOne({ 
        userName: username 
      });
      
      if (!adminResult) {
        req.flash("error", "Không tìm thấy thông tin admin!");
        return res.redirect('/admin/login');
      }

      // Lấy dữ liệu thống kê - SỬA: dùng đúng tên biến đã import
      const [customerCount, productCount, billCount, typeCount] = await Promise.all([
        customers.countDocuments(),
        product.countDocuments(),
        bill.countDocuments(),
        type.countDocuments()
      ]);

      // SỬA: Dùng findWithLimit thay vì find().limit()
      const recentOrders = await bill.findWithLimit({}, 5);
      
      res.render("dashboard", {
        customer: adminResult,
        customerCount,
        productCount, 
        billCount,
        typeCount,
        abc: recentOrders, // Thêm dữ liệu đơn hàng
        products: await product.findWithLimit({}, 10), // Thêm dữ liệu sản phẩm
        message: req.flash("success") || ''
      });
    } else {
      res.redirect('/admin/login');
    }
  } catch (err) {
    console.error("Lỗi trang dashboard admin:", err);
    req.flash("error", "Lỗi tải trang dashboard!");
    res.redirect('/admin/login');
  }
}

  async getProductManagerAtPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const numberItemPerpage = 12;
        const page = req.params.page;
        
        const [productResult, resultCustomer, supplierResult, typeResult] = await Promise.all([
          product.find({}),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
          supplier.find({}),
          type.find({})
        ]);

        res.render("products-manager", {
          products: productResult,
          customer: resultCustomer,
          types: typeResult,
          suppliers: supplierResult,
          message: req.flash("success"),
          page: page,
          numberItemPerpage: numberItemPerpage,
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý sản phẩm!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getAddProductPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const [supplierResult, typeResult, customerResult] = await Promise.all([
          supplier.find({}),
          type.find({}),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
        ]);

        res.render("add-product", {
          suppliers: supplierResult,
          types: typeResult,
          customer: customerResult,
          message: "",
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang thêm sản phẩm!");
        res.redirect("/admin/dashboard/products-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async postAddProduct(req, res, next) {
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

        await product.create(data);
        req.flash("success", "Thêm sản phẩm thành công!");
        res.redirect("/admin/dashboard/products-manager/");
      } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        req.flash("error", "Có lỗi xảy ra trong quá trình thêm sản phẩm!");
        res.redirect("/admin/dashboard/products-manager/add");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getProductManagerPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const numberItemPerpage = 12;
        
        const [productResult, resultCustomer, supplierResult, typeResult] = await Promise.all([
          product.find({}),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
          supplier.find({}),
          type.find({})
        ]);

        res.render("products-manager", {
          products: productResult,
          customer: resultCustomer,
          types: typeResult,
          suppliers: supplierResult,
          message: req.flash("success"),
          page: 1,
          numberItemPerpage: numberItemPerpage,
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý sản phẩm!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getHideProductInfo(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const idProduct = req.params.id;
        
        const productResult = await product.findById(idProduct);
        if (!productResult) {
          req.flash("error", "Không tìm thấy sản phẩm!");
          return res.redirect("/admin/dashboard/products-manager");
        }
        
        const newStatus = !productResult.description.status;
        await product.findByIdAndUpdate(idProduct, {
          description: {
            ...productResult.description,
            status: newStatus
          }
        });

        req.flash("success", "Ẩn/Hiển thị thông tin thành công!");
        res.redirect("/admin/dashboard/products-manager");
      } catch (err) {
        console.error(err);
        req.flash("error", "Ẩn/Hiển thị thông tin không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/products-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getDeleteProductInfo(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const idProduct = req.params.id;
        
        const result = await product.findByIdAndDelete(idProduct);
        if (!result) {
          req.flash("error", "Không tìm thấy sản phẩm để xóa!");
          return res.redirect("/admin/dashboard/products-manager");
        }
        
        req.flash("success", "Xóa thông tin thành công!");
        res.redirect("/admin/dashboard/products-manager");
      } catch (err) {
        console.error(err);
        req.flash("error", "Xóa thông tin không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/products-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getUpdateProductPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const idProduct = req.params.id;
        
        const [productResult, typeResult, supplierResult, customerResult] = await Promise.all([
          product.findById(idProduct),
          type.find({}),
          supplier.find({}),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
        ]);

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
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang cập nhật sản phẩm!");
        res.redirect("/admin/dashboard/products-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async postUpdateProductPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const idProduct = req.params.id;
        
        const productResult = await product.findById(idProduct);
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

        await product.findByIdAndUpdate(idProduct, updateData);
        req.flash("success", "Cập nhật thông tin thành công!");
        res.redirect("/admin/dashboard/products-manager");
      } catch (err) {
        console.error(err);
        req.flash("error", "Cập nhật thông tin không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/products-manager/update/" + idProduct);
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getCategoriesManagerPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const numberItemPerpage = 6;
        const [customerResult, typeResult] = await Promise.all([
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
          type.find({})
        ]);

        res.render('categories-manager', {
          customer: customerResult,
          categories: typeResult,
          page: 1,
          numberItemPerpage: numberItemPerpage,
          message: req.flash("success")
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý danh mục!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect('/admin/login');
    }
  }

  async getCategoriesManagerAtPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const numberItemPerpage = 6;
        const page = req.params.page;
        const [customerResult, typeResult] = await Promise.all([
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
          type.find({})
        ]);

        res.render('categories-manager', {
          customer: customerResult,
          categories: typeResult,
          page: page,
          numberItemPerpage: numberItemPerpage,
          message: req.flash("success")
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý danh mục!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect('/admin/login');
    }
  }

  async getUpdateCategoriesPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const id = req.params.id;
        const [typeResult, customerResult] = await Promise.all([
          type.findById(id),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
        ]);

        res.render('update-categories', {
          type: typeResult, 
          customer: customerResult,
          message: req.flash("success") || req.flash("error") || ''
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang cập nhật danh mục!");
        res.redirect("/admin/dashboard/categories-manager");
      }
    } else {
      res.redirect('/admin/login');
    }
  }

  async getAddCategoriesPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const customerResult = await admin.findOne({ "loginInformation.userName": req.session.passport.user.username });
        res.render('add-categories', { customer: customerResult });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang thêm danh mục!");
        res.redirect("/admin/dashboard/categories-manager");
      }
    } else {
      res.redirect('/admin/login');
    }
  }

  async postAddCategories(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const data = {
          typeName: req.body.name,
          thumbnail: req.file ? `/${req.file.path}` : '',
          status: req.body.status === 'on' || req.body.status === 'true'
        };

        await type.create(data);
        req.flash('success', 'Thêm danh mục thành công!');
        res.redirect('/admin/dashboard/categories-manager/');
      } catch (err) {
        console.log(err);
        req.flash('error', 'Thêm danh mục không thành công! Có lỗi xảy ra!');
        res.redirect('/admin/dashboard/categories-manager/add');
      }
    } else {
      res.redirect('/admin/login');
    }
  }

  async postUpdateCategoriesPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const id = req.params.id;
        const typeResult = await type.findById(id);
        if (!typeResult) {
          req.flash("error", "Không tìm thấy danh mục!");
          return res.redirect("/admin/dashboard/categories-manager");
        }
        
        const data = {
          typeName: req.body.name,
          thumbnail: req.file ? `/${req.file.path}` : typeResult.thumbnail,
          status: req.body.status === 'on' || req.body.status === 'true'
        };
        
        await type.findByIdAndUpdate(id, data);
        req.flash("success", "Cập nhật thông tin danh mục thành công!");
        res.redirect("/admin/dashboard/categories-manager");
      } catch (err) {
        console.log(err);
        req.flash("error", "Cập nhật thông tin danh mục không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/categories-manager/update/" + id);
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getDeleteCategoriesInfo(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const id = req.params.id;
        await type.findByIdAndDelete(id);
        req.flash("success", "Xóa danh mục thành công!");
        res.redirect("/admin/dashboard/categories-manager");
      } catch (err) {
        console.log(err);
        req.flash("error", "Xóa danh mục không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/categories-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  // Sửa hàm getOrdersManagerPage
async getOrdersManagerPage(req, res, next) {
  if (req.isAuthenticated()) {
    try {
      const numberItemPerpage = 6;
      const [customerResult, billResult] = await Promise.all([
        admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
        bill.find({})
      ]);

      // Lọc bills không phải "Chờ xác nhận"
      const filteredBills = billResult.filter(b => b.status !== 'Chờ xác nhận');

      console.log('📦 Orders found:', filteredBills.length);

      res.render('orders-manager', {
        customer: customerResult,
        bills: filteredBills,
        page: 1,
        numberItemPerpage: numberItemPerpage,
        message: req.flash("success")
      });
    } catch (err) {
      console.error("❌ Lỗi getOrdersManagerPage:", err);
      req.flash("error", "Có lỗi xảy ra khi tải trang quản lý đơn hàng!");
      res.redirect("/admin/dashboard");
    }
  } else {
    res.redirect("/admin/login");
  }
}

// Sửa hàm getPendingOrderPage
async getPendingOrderPage(req, res, next) {
  if (req.isAuthenticated()) {
    try {
      const numberItemPerpage = 6;
      const [customerResult, billResult] = await Promise.all([
        admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
        bill.find({ status: 'Chờ xác nhận' })
      ]);

      console.log('⏳ Pending orders found:', billResult.length);

      res.render('pending-order', {
        customer: customerResult,
        bills: billResult,
        page: 1,
        numberItemPerpage: numberItemPerpage,
        message: req.flash("success")
      });
    } catch (err) {
      console.error("❌ Lỗi getPendingOrderPage:", err);
      req.flash("error", "Có lỗi xảy ra khi tải trang đơn hàng chờ xác nhận!");
      res.redirect("/admin/dashboard");
    }
  } else {
    res.redirect('/admin/login');
  }
}

// Sửa hàm getUpdateOrder - QUAN TRỌNG
async getUpdateOrder(req, res, next) {
  try {
    const id = req.params.id;
    console.log('🔍 Getting order for update:', id);
    
    const user = req.session.passport.user.username;
    const [customerResult, billResult] = await Promise.all([
      admin.findOne({ 'loginInformation.userName': user }),
      bill.findById(id)
    ]);

    if (!billResult) {
      console.log('❌ Order not found:', id);
      req.flash("error", "Đơn hàng không tồn tại!");
      return res.redirect('/admin/dashboard/orders-manager');
    }
    
    console.log('✅ Order found:', billResult._id);
    
    res.render('update-order', {
      customer: customerResult, 
      bill: billResult,
      message: req.flash("success") || req.flash("error") || ''
    });
  } catch (err) {
    console.error("❌ Lỗi getUpdateOrder:", err);
    req.flash("error", "Lỗi tải thông tin đơn hàng!");
    res.redirect('/admin/dashboard/orders-manager');
  }
}

// Sửa hàm postUpdateOrder - QUAN TRỌNG
async postUpdateOrder(req, res, next) {
  try {
    const id = req.params.id;
    console.log('🔄 Updating order:', id);
    console.log('📝 Update data:', req.body);

    const {
      name,
      city,
      district,
      ward,
      address,
      status
    } = req.body;

    // Validate required fields
    if (!name || !city || !district || !ward || !address || !status) {
      req.flash('error', 'Vui lòng điền đầy đủ thông tin!');
      return res.redirect('/admin/dashboard/orders-manager/update/' + id);
    }

    // Tách tên
    const nameParts = name.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ');
    const lastName = nameParts.slice(-1).join(' ');

    // Lấy thông tin địa chỉ
    let fullAddress = address;
    try {
      const cityResult = await region.findOne({ Id: city });
      if (cityResult) {
        const districtData = cityResult.Districts.find(d => d.Id == district);
        if (districtData) {
          const wardData = districtData.Wards.find(w => w.Id == ward);
          if (wardData) {
            fullAddress = `${address}, ${wardData.Name}, ${districtData.Name}, ${cityResult.Name}`;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Lỗi xử lý địa chỉ:', error.message);
      // Vẫn tiếp tục với địa chỉ đã nhập
    }

    // Dữ liệu cập nhật
    const updateData = {
      firstName: firstName,
      lastName: lastName,
      address: fullAddress,
      status: status,
      updatedAt: new Date()
    };

    console.log('📦 Update data to save:', updateData);

    // Cập nhật đơn hàng
    const result = await bill.findByIdAndUpdate(id, updateData);
    
    if (!result) {
      req.flash('error', 'Không tìm thấy đơn hàng để cập nhật!');
      return res.redirect('/admin/dashboard/orders-manager/update/' + id);
    }

    console.log('✅ Order updated successfully');
    req.flash('success', 'Cập nhật thông tin đơn hàng thành công!');
    res.redirect('/admin/dashboard/orders-manager');
  } catch (err) {
    console.error("❌ Lỗi postUpdateOrder:", err);
    req.flash('error', 'Cập nhật thông tin đơn hàng không thành công: ' + err.message);
    res.redirect('/admin/dashboard/orders-manager/update/' + req.params.id);
  }
}

// Sửa hàm getUpdateStatusOrder
async getUpdateStatusOrder(req, res, next) {
  try {
    const id = req.params.id;
    console.log('🔄 Updating order status to preparing:', id);
    
    const result = await bill.findByIdAndUpdate(id, { 
      status: 'Chuẩn bị hàng',
      updatedAt: new Date()
    });
    
    if (!result) {
      req.flash("error", "Không tìm thấy đơn hàng!");
      return res.redirect('/admin/dashboard/pending-orders-manager');
    }
    
    console.log('✅ Order status updated successfully');
    req.flash("success", "Đã xác nhận đơn hàng!");
    res.redirect('/admin/dashboard/pending-orders-manager');
  } catch (err) {
    console.error("❌ Lỗi getUpdateStatusOrder:", err);
    req.flash("error", "Lỗi xác nhận đơn hàng!");
    res.redirect('/admin/dashboard/pending-orders-manager');
  }
}

// Sửa hàm getDeleteStatusOrder
async getDeleteStatusOrder(req, res, next) {
  try {
    const id = req.params.id;
    console.log('🗑️ Cancelling order:', id);
    
    const result = await bill.findByIdAndUpdate(id, { 
      status: 'Đã hủy',
      updatedAt: new Date()
    });
    
    if (!result) {
      req.flash("error", "Không tìm thấy đơn hàng!");
      return res.redirect('/admin/dashboard/pending-orders-manager');
    }
    
    console.log('✅ Order cancelled successfully');
    req.flash("success", "Đã hủy đơn hàng!");
    res.redirect('/admin/dashboard/pending-orders-manager');
  } catch (err) {
    console.error("❌ Lỗi getDeleteStatusOrder:", err);
    req.flash("error", "Lỗi hủy đơn hàng!");
    res.redirect('/admin/dashboard/pending-orders-manager');
  }
}

// Sửa hàm getDeleteOrder
async getDeleteOrder(req, res, next) {
  try {
    const id = req.params.id;
    console.log('🗑️ Deleting order:', id);
    
    const result = await bill.findByIdAndUpdate(id, { 
      status: 'Đã hủy',
      updatedAt: new Date()
    });
    
    if (!result) {
      req.flash("error", "Không tìm thấy đơn hàng!");
      return res.redirect('/admin/dashboard/orders-manager');
    }
    
    console.log('✅ Order deleted successfully');
    req.flash("success", "Đã hủy đơn hàng!");
    res.redirect('/admin/dashboard/orders-manager');
  } catch (err) {
    console.error("❌ Lỗi getDeleteOrder:", err);
    req.flash("error", "Lỗi hủy đơn hàng!");
    res.redirect('/admin/dashboard/orders-manager');
  }
}

// Sửa hàm getOrderDetail
async getOrderDetail(req, res, next) {
  try {
    const id = req.params.id;
    console.log('🔍 Getting order details:', id);
    
    if (req.isAuthenticated()) {
      const user = req.session.passport.user.username;
      const [customerResult, billResult] = await Promise.all([
        admin.findOne({ 'loginInformation.userName': user }),
        bill.findById(id)
      ]);

      if (!billResult) {
        console.log('❌ Order not found for detail:', id);
        req.flash("error", "Đơn hàng không tồn tại!");
        return res.redirect('back');
      }
      
      // Tính tổng tiền
      let totalAmount = 0;
      let totalProducts = 0;
      billResult.listProduct.forEach(product => {
        totalAmount += parseInt(product.productPrice || 0) * (product.amount || 1);
        totalProducts += parseInt(product.amount || 1);
      });
      
      console.log('✅ Order detail loaded successfully');
      
      res.render('order-detail', {
        customer: customerResult,
        bill: billResult,
        totalAmount: totalAmount,
        totalProducts: totalProducts,
        message: req.flash("success")
      });
    } else {
      res.redirect('/admin/login');
    }
  } catch (err) {
    console.error("❌ Lỗi getOrderDetail:", err);
    req.flash("error", "Lỗi tải thông tin đơn hàng!");
    res.redirect('back');
  }
}

  getLogout(req, res, next) {
    req.logout();
    res.redirect('/admin/login');
  }

  // Quản lý người dùng
  async getUsersManagerPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const numberItemPerpage = 10;
        const [usersResult, customerResult] = await Promise.all([
          customers.find({}),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
        ]);

        res.render("users-manager", {
          users: usersResult,
          customer: customerResult,
          message: req.flash("success"),
          page: 1,
          numberItemPerpage: numberItemPerpage,
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý người dùng!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getUsersManagerAtPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const numberItemPerpage = 10;
        const page = req.params.page;
        const [usersResult, customerResult] = await Promise.all([
          customers.find({}),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
        ]);

        res.render("users-manager", {
          users: usersResult,
          customer: customerResult,
          message: req.flash("success"),
          page: page,
          numberItemPerpage: numberItemPerpage,
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang quản lý người dùng!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getUpdateUserPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const userId = req.params.id;
        const [userResult, customerResult] = await Promise.all([
          customers.findById(userId),
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username })
        ]);

        if (!userResult) {
          req.flash("error", "Không tìm thấy người dùng!");
          return res.redirect("/admin/dashboard/users-manager");
        }
        
        res.render("update-user", {
          customer: customerResult,
          user: userResult,
          message: req.flash("success") || req.flash("error") || ''
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang cập nhật người dùng!");
        res.redirect("/admin/dashboard/users-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async postUpdateUserPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const userId = req.params.id;
        
        const userResult = await customers.findById(userId);
        if (!userResult) {
          req.flash("error", "Không tìm thấy người dùng!");
          return res.redirect("/admin/dashboard/users-manager");
        }

        // Tạo object update data
        const updateData = {
          firstName: req.body.firstname,
          lastName: req.body.lastname,
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
        }

        // Xử lý mật khẩu nếu có
        if (req.body.password && req.body.password.trim() !== '') {
          updateData.password = req.body.password;
        }

        await customers.findByIdAndUpdate(userId, updateData);
        req.flash("success", "Cập nhật thông tin người dùng thành công!");
        res.redirect("/admin/dashboard/users-manager");
      } catch (err) {
        console.error("Lỗi khi cập nhật:", err);
        req.flash("error", "Cập nhật thông tin người dùng không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/users-manager/update/" + userId);
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getPendingOrderAtPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const numberItemPerpage = 6;
        const page = req.params.page;
        const [customerResult, billResult] = await Promise.all([
          admin.findOne({ "loginInformation.userName": req.session.passport.user.username }),
          bill.find({ status: 'Chờ xác nhận' })
        ]);

        res.render('pending-order', {
          customer: customerResult,
          bills: billResult,
          page: page,
          numberItemPerpage: numberItemPerpage,
          message: req.flash("success")
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang đơn hàng chờ xác nhận!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect('/admin/login');
    }  
  }

  async getDeleteUserInfo(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const userId = req.params.id;
        const result = await customers.findByIdAndDelete(userId);
        if (!result) {
          req.flash("error", "Không tìm thấy người dùng để xóa!");
          return res.redirect("/admin/dashboard/users-manager");
        }
        req.flash("success", "Xóa người dùng thành công!");
        res.redirect("/admin/dashboard/users-manager");
      } catch (err) {
        console.error(err);
        req.flash("error", "Xóa người dùng không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/users-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getBlockUserInfo(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const userId = req.params.id;
        const userResult = await customers.findById(userId);
        if (!userResult) {
          req.flash("error", "Không tìm thấy người dùng!");
          return res.redirect("/admin/dashboard/users-manager");
        }
        
        const newStatus = !userResult.loginInformation.status;
        await customers.findByIdAndUpdate(userId, {
          status: newStatus
        });

        req.flash("success", "Khóa/Mở khóa người dùng thành công!");
        res.redirect("/admin/dashboard/users-manager");
      } catch (err) {
        console.error(err);
        req.flash("error", "Khóa/Mở khóa người dùng không thành công! Có lỗi xảy ra!");
        res.redirect("/admin/dashboard/users-manager");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  async getUpdateAllStatusOrder(req, res, next) {
    try {
      const data = { status: 'Chuẩn bị hàng' };
      // Lấy tất cả bill có status 'Chờ xác nhận' và cập nhật
      const pendingBills = await bill.find({ status: 'Chờ xác nhận' });
      for (const billItem of pendingBills) {
        await bill.findByIdAndUpdate(billItem._id, data);
      }
      req.flash("success", "Đã xác nhận tất cả đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    } catch (err) {
      console.log(err);
      req.flash("error", "Lỗi xác nhận đơn hàng!");
      res.redirect('/admin/dashboard/pending-orders-manager');
    }
  }

  // Trang thông tin tài khoản
  async getAccountPage(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const customerResult = await admin.findOne({ "loginInformation.userName": req.session.passport.user.username });
        if (!customerResult) {
          req.flash("error", "Không tìm thấy thông tin tài khoản!");
          return res.redirect("/admin/dashboard");
        }
        
        res.render("account", {
          customer: customerResult,
          message: req.flash("success") || req.flash("error") || ''
        });
      } catch (err) {
        console.error(err);
        req.flash("error", "Có lỗi xảy ra khi tải trang thông tin tài khoản!");
        res.redirect("/admin/dashboard");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  // Cập nhật thông tin tài khoản
  async postUpdateAccount(req, res, next) {
    if (req.isAuthenticated()) {
      try {
        const username = req.session.passport.user.username;
        
        // Validation cơ bản
        const { firstname, lastname, email, phoneNumber } = req.body;
        if (!firstname || !lastname || !email || !phoneNumber) {
          req.flash("error", "Vui lòng điền đầy đủ thông tin bắt buộc!");
          return res.redirect("/admin/dashboard/account");
        }

        const adminResult = await admin.findOne({ "loginInformation.userName": username });
        if (!adminResult) {
          req.flash("error", "Không tìm thấy tài khoản!");
          return res.redirect("/admin/dashboard/account");
        }

        // Tạo object update data
        const updateData = {
          firstName: firstname,
          lastName: lastname,
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
        }

        await admin.findOneAndUpdate({ "loginInformation.userName": username }, updateData);
        req.flash("success", "Cập nhật thông tin tài khoản thành công!");
        res.redirect("/admin/dashboard/account");
      } catch (err) {
        console.error("Lỗi khi cập nhật:", err);
        req.flash("error", "Cập nhật thông tin tài khoản không thành công: " + err.message);
        res.redirect("/admin/dashboard/account");
      }
    } else {
      res.redirect("/admin/login");
    }
  }

  // Đổi mật khẩu
  async postChangePassword(req, res, next) {
    if (req.isAuthenticated()) {
      try {
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

        const adminResult = await admin.findOne({ "loginInformation.userName": username });
        if (!adminResult) {
          req.flash("error", "Không tìm thấy tài khoản!");
          return res.redirect("/admin/dashboard/account");
        }

        // Kiểm tra mật khẩu hiện tại
        if (adminResult.loginInformation.password !== currentPassword) {
          req.flash("error", "Mật khẩu hiện tại không đúng!");
          return res.redirect("/admin/dashboard/account");
        }

        // Cập nhật mật khẩu mới
        await admin.findOneAndUpdate(
          { "loginInformation.userName": username }, 
          { 
            password: newPassword,
            updatedAt: new Date()
          }
        );

        req.flash("success", "Đổi mật khẩu thành công!");
        res.redirect("/admin/dashboard/account");
      } catch (err) {
        console.error("Lỗi khi đổi mật khẩu:", err);
        req.flash("error", "Đổi mật khẩu không thành công!");
        res.redirect("/admin/dashboard/account");
      }
    } else {
      res.redirect("/admin/login");
    }
  }
}

module.exports = new AdminController();