const type = require("../models-mysql/types");
const supplier = require("../models-mysql/suppliers");
const product = require("../models-mysql/products");
const customers = require("../models-mysql/customers");
const region = require('../models-mysql/regions');
const bill = require('../models-mysql/bills');

class IndexController {
  // IndexController.js - SỬA LẠI HOÀN TOÀN
async index(req, res, next) {
  try {
    console.log("=== DEBUG INDEX CONTROLLER ===");
    console.log("User session:", req.user);
    console.log("Is authenticated:", req.isAuthenticated());
    
    // Lấy danh mục với status: true
    const typeResult = await type.findActive();
    console.log("Số danh mục tìm thấy:", typeResult?.length);

    // LẤY SẢN PHẨM NỔI BẬT - SỬA LẠI CÁCH TÌM KIẾM
    let featuredProducts = [];
    try {
      // Thử lấy sản phẩm đánh dấu featured (nếu có)
      featuredProducts = await product.findWithLimit({
        "description.featured": true,
        "description.status": true
      }, 12, 0);

      // Nếu không có sản phẩm featured, lấy sản phẩm mới nhất theo description.status
      if (!featuredProducts || featuredProducts.length === 0) {
        console.log("Không có sản phẩm nổi bật, lấy sản phẩm mới nhất");
        featuredProducts = await product.findWithLimit({
          "description.status": true
        }, 12, 0);
      }

      console.log("Số sản phẩm tìm thấy:", featuredProducts?.length);

      // Đảm bảo mỗi sản phẩm có đầy đủ thông tin
      if (featuredProducts && featuredProducts.length > 0) {
        featuredProducts = featuredProducts.map(p => {
          if (!p.description) {
            p.description = {
              price: 0,
              stock: 0,
              unit: 'cái',
              imageList: [],
              status: true
            };
          }
          return p;
        });
      }
    } catch (productError) {
      console.error("Lỗi khi lấy sản phẩm:", productError);
      featuredProducts = [];
    }

    let customerResult = null;
    let favoriteCount = 0;

    if (req.isAuthenticated() && req.user) {
      console.log("User đã đăng nhập, username:", req.user.loginInformation?.userName);
      
      const username = req.user.loginInformation?.userName;
      
      if (username) {
        // Tìm user theo userName
        customerResult = await customers.findOne({ 
          userName: username 
        });
        
        console.log("Kết quả tìm user:", customerResult ? "Found" : "Not found");
        
        // Tính số lượng sản phẩm yêu thích
        if (customerResult && customerResult.listFavorite) {
          favoriteCount = Array.isArray(customerResult.listFavorite) 
            ? customerResult.listFavorite.length 
            : 0;
        }
      }
    }

    // DEBUG: Kiểm tra dữ liệu trước khi render
    console.log("=== FINAL DATA ===");
    console.log("Categories:", typeResult?.length);
    console.log("Products:", featuredProducts?.length);
    console.log("Customer:", customerResult ? "Exists" : "Null");

    res.render("index", { 
      data: typeResult || [], 
      featuredProducts: featuredProducts || [],
      message: req.flash("success")[0] || req.flash("error")[0], 
      customer: customerResult,
      favoriteCount: favoriteCount
    });
    
  } catch (err) {
    console.error("Lỗi trang chủ:", err);
    res.render("index", { 
      data: [], 
      featuredProducts: [],
      message: "Có lỗi xảy ra khi tải trang", 
      customer: null 
    });
  }
}
  getLoginPage(req, res, next) {
    const messageError = req.flash("error");
    const messageSuccess = req.flash("success");
    res.render("loginuser", { 
      message: messageError.length != 0 ? messageError : messageSuccess, 
      typeMessage: messageSuccess.length != 0 ? 'success': 'error'
    });
  }

  async debugData(req, res) {
  try {
    console.log("=== DEBUG DATA ===");
    
    // Test lấy danh mục
    const types = await type.find({});
    console.log("Types:", types?.length, types);
    
    // Test lấy sản phẩm nổi bật
    const featured = await product.find({ 
      "description.featured": true,
      "description.status": true 
    });
    console.log("Featured products:", featured?.length, featured);
    
    // Test lấy user
    if (req.user) {
      const user = await customers.findOne({ 
        userName: req.user.loginInformation?.userName 
      });
      console.log("User found:", user);
    }
    
    res.json({
      types: types?.length,
      featured: featured?.length,
      user: req.user ? 'logged_in' : 'not_logged_in'
    });
    
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
}

  async getCartPage(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const username = req.user.loginInformation?.userName;
        const customerResult = await customers.findOne({
          "loginInformation.userName": username
        });
        res.render("cart", { customer: customerResult, message: req.flash('success') });
      } catch (err) {
        console.error(err);
        req.flash("error", "Lỗi tải giỏ hàng!");
        res.redirect("/");
      }
    } else {
      res.redirect("/login");
    }
  }

  async getAddToCartSingle(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const id = req.params.id;
        const username = req.user.loginInformation?.userName;
        const productResult = await product.findById(id);
        
        if (!productResult) {
          req.flash("error", "Không tìm thấy sản phẩm!");
          return res.redirect(`/product/`);
        }

        const productData = {
          productID: productResult._id.toString(),
          productName: productResult.productName,
          productPrice: productResult.description.price,
          productImage: productResult.description.imageList ? productResult.description.imageList[0] : '',
          amount: 1,
        };

        await customers.updateCart(username, productData);
        req.flash("success", "Sản phẩm đã thêm vào giỏ!");
        res.redirect(`/product/`);
      } catch (err) {
        console.log(err);
        req.flash("error", "Lỗi khi thêm sản phẩm vào giỏ!");
        res.redirect(`/product/`);
      }
    } else {
      res.redirect("/login");
    }
  }

  async postAddToCartMulti(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const id = req.params.id;
        const username = req.user.loginInformation?.userName;
        const amount = req.body.quantity ? parseInt(req.body.quantity) : 1;
        const productResult = await product.findById(id);
        
        if (!productResult) {
          req.flash("error", "Không tìm thấy sản phẩm!");
          return res.redirect(`/product/`);
        }

        const productData = {
          productID: productResult._id.toString(),
          productName: productResult.productName,
          productPrice: productResult.description.price,
          productImage: productResult.description.imageList ? productResult.description.imageList[0] : '',
          amount: amount,
        };

        await customers.updateCart(username, productData);
        req.flash("success", "Sản phẩm đã thêm vào giỏ!");
        res.redirect(`/product/`);
      } catch (err) {
        console.log(err);
        req.flash("error", "Lỗi khi thêm sản phẩm vào giỏ!");
        res.redirect(`/product/`);
      }
    } else {
      res.redirect("/login");
    }
  }

  async postUpdateQTYInCart(req, res, next) {
    try {
      const id = req.params.id;
      const quantity = parseInt(req.body.amount);
      const username = req.user.loginInformation?.userName;
      
      await customers.updateCartItem(username, id, quantity);
      req.flash("success", "Cập nhật số lượng thành công!");
      res.redirect('/cart');
    } catch (err) {
      console.log(err);
      req.flash("error", "Lỗi khi cập nhật số lượng!");
      res.redirect('/cart');
    }
  }

  async getDeleteProductInCart(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const id = req.params.id;
        const username = req.user.loginInformation?.userName;
        
        await customers.removeFromCart(username, id);
        req.flash("success", "Đã xóa sản phẩm khỏi giỏ!");
        res.redirect('/cart');
      } catch (err) {
        console.log(err);
        req.flash("error", "Lỗi khi xóa sản phẩm!");
        res.redirect('/cart');
      }
    } else {
      res.redirect('/login');
    }
  }

  async getCheckoutPage(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const username = req.user.loginInformation?.userName;
        const customerResult = await customers.findOne({ 
          "loginInformation.userName": username 
        });
        
        if (!customerResult) {
          req.flash("error", "Không tìm thấy thông tin người dùng!");
          return res.redirect('/cart');
        }
        
        res.render("checkout", { customer: customerResult });
      } catch (err) {
        console.error(err);
        req.flash("error", "Lỗi tải trang thanh toán!");
        res.redirect('/cart');
      }
    } else {
      res.redirect('/login');
    }
  }

  async postCheckout(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const username = req.user.loginInformation?.userName;
        const city = req.body.city;
        const district = req.body.district;
        const ward = req.body.ward;
        const address = req.body.address;
        
        const customerResult = await customers.findOne({ 
          "loginInformation.userName": username 
        });
        
        if (!customerResult) {
          req.flash("error", "Không tìm thấy thông tin người dùng!");
          return res.redirect('/checkout');
        }

        const cityResult = await region.findOne({ Id: city });
        
        if (!cityResult) {
          req.flash("error", "Lỗi xác thực địa chỉ!");
          return res.redirect('/checkout');
        }

        const districtData = cityResult.Districts.find(e => e.Id == district);
        const districtName = districtData?.Name || '';
        const wardData = districtData?.Wards.find(e => e.Id == ward);
        const wardName = wardData?.Name || '';
        
        const data = {
          userID: customerResult._id,
          firstName: customerResult.fullNameCustomer?.firstName,
          lastName: customerResult.fullNameCustomer?.lastName,
          listProduct: customerResult.listProduct || [],
          address: `${address}, ${wardName}, ${districtName}, ${cityResult.Name}`,
          paymentMethod: parseInt(req.body.payment) == 1 ? "Thanh toán khi nhận hàng" : "Paypal",
          resquest: req.body.comment || '',
          status: 'Chờ xác nhận'
        };

        await bill.create(data);
        
        // Xóa giỏ hàng sau khi đặt hàng thành công
        await customers.findByIdAndUpdate(customerResult._id, {
          listProduct: JSON.stringify([])
        });

        req.flash('success', 'Đặt hàng thành công!');
        res.redirect('/cart');
      } catch (err) {
        console.log(err);
        req.flash("error", "Lỗi khi đặt hàng!");
        res.redirect('/checkout');
      }
    } else {
      res.redirect('/login');
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

      if (req.isAuthenticated() && req.user) {
        const username = req.user.loginInformation?.userName;
        // SỬA: Tìm customer theo userName
        const customerResult = await customers.findOne({ 
          userName: username 
        });
        res.render("search", {
          types: typeResult,
          suppliers: supplierResult,
          products: productResult,
          key: key,
          customer: customerResult
        });
      } else {
        res.render("search", {
          types: typeResult,
          suppliers: supplierResult,
          products: productResult,
          key: key,
          customer: undefined
        });
      }
    } catch (err) {
      console.error(err);
      res.render("search", {
        types: [],
        suppliers: [],
        products: [],
        key: req.query.search,
        customer: undefined
      });
    }
  }

  getRegisterPage(req, res, next) {
    res.render('sign-up', {
      message: req.flash('success').length != 0 ? req.flash('success') : req.flash('error')
    });
  }

  async postRegisterUser(req, res, next) {
  try {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const username = req.body.username;
    const phone = req.body.phone;
    const cmnd = req.body.cmnd;
    const email = req.body.email;
    const password = req.body.password;
    const re_password = req.body.repassword;

    if (password !== re_password) {
      req.flash('error', 'Mật khẩu xác nhận không khớp!');
      return res.redirect('/sign-up');
    }

    // SỬA: Tìm user bằng userName
    const existingCustomer = await customers.findOne({ 
      userName: username 
    });
    if (existingCustomer) {
      req.flash('error', 'Tài khoản đã tồn tại!');
      return res.redirect('/sign-up');
    }

    const data = {
      fullNameCustomer: {
        firstName: firstname,
        lastName: lastname
      },
      dateOfBirth: null,
      sex: null,
      identityCardNumber: cmnd,
      address: null,
      phoneNumber: phone,
      email: email,
      listProduct: [],
      listFavorite: [],
      loginInformation: {
        userName: username,
        password: password,
        type: 'User',
        roles: [],
        status: true
      },
      avatar: '/uploads/user-01.png'
    };

    await customers.create(data);
    req.flash('success', 'Tạo tài khoản thành công!');
    res.redirect('/login');
  } catch (err) {
    console.log(err);
    req.flash('error', 'Tạo tài khoản không thành công!');
    res.redirect('/sign-up');
  }
}

  async getAddFavorite(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const id = req.params.id;
        const username = req.user.loginInformation?.userName;
        const productResult = await product.findById(id);
        
        if (!productResult) {
          req.flash("error", "Không tìm thấy sản phẩm!");
          return res.redirect(`/product/`);
        }

        await customers.updateFavorites(username, productResult);
        req.flash("success", "Đã thêm vào danh sách yêu thích!");
        res.redirect(`/product/`);
      } catch (err) {
        console.log(err);
        req.flash("error", "Lỗi khi thêm sản phẩm vào danh sách yêu thích!");
        res.redirect(`/product/`);
      }
    } else {
      res.redirect("/login");
    }
  }

  async getFavoritePage(req, res, next) {
    try {
      const itemsPerPage = 6;
      if (req.isAuthenticated() && req.user) {
        const username = req.user.loginInformation?.userName;
        const [customerResult, typeResult, supplierResult] = await Promise.all([
          customers.findOne({ 
            "loginInformation.userName": username 
          }),
          type.find({}),
          supplier.find({})
        ]);

        if (!customerResult) {
          req.flash("error", "Không tìm thấy thông tin người dùng!");
          return res.redirect('/');
        }

        res.render("favorites", {
          data: customerResult.listFavorite || [],
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: 1,
          message: req.flash('success'),
          customer: customerResult
        });
      } else {
        res.redirect('/login');
      }
    } catch (err) {
      console.error(err);
      req.flash("error", "Lỗi tải trang yêu thích!");
      res.redirect('/');
    }
  }

  async getFavoriteAtPage(req, res, next) {
    try {
      const itemsPerPage = 6;
      const page = req.params.page;
      if (req.isAuthenticated() && req.user) {
        const username = req.user.loginInformation?.userName;
        const [customerResult, typeResult, supplierResult] = await Promise.all([
          customers.findOne({ 
            "loginInformation.userName": username 
          }),
          type.find({}),
          supplier.find({})
        ]);

        if (!customerResult) {
          req.flash("error", "Không tìm thấy thông tin người dùng!");
          return res.redirect('/');
        }

        res.render("favorites", {
          data: customerResult.listFavorite || [],
          types: typeResult,
          suppliers: supplierResult,
          itemsPerPage: itemsPerPage,
          currentPage: page,
          message: req.flash('success'),
          customer: customerResult
        });
      } else {
        res.redirect('/login');
      }
    } catch (err) {
      console.error(err);
      req.flash("error", "Lỗi tải trang yêu thích!");
      res.redirect('/');
    }
  }

  async getDeleteFavorite(req, res, next) {
    if (req.isAuthenticated() && req.user) {
      try {
        const id = req.params.id;
        const username = req.user.loginInformation?.userName;
        
        await customers.removeFromFavorites(username, id);
        req.flash("success", "Đã xóa sản phẩm khỏi yêu thích!");
        res.redirect('/favorite');
      } catch (err) {
        console.log(err);
        req.flash("error", "Lỗi khi xóa sản phẩm!");
        res.redirect('/favorite');
      }
    } else {
      res.redirect('/login');
    }
  }
}

module.exports = new IndexController();