const BaseModel = require('./baseModel');

class Customer extends BaseModel {
  constructor() {
    super('customers');
  }

  async findOne(query) {
  console.log("🔍 Customer findOne query:", query);
  
  // XỬ LÝ TRƯỜNG ĐẶC BIỆT
  if (query['loginInformation.userName']) {
    return await super.findOne({ userName: query['loginInformation.userName'] });
  }
  
  // Nếu query có userName, tìm trực tiếp
  if (query.userName) {
    return await super.findOne({ userName: query.userName });
  }
  
  return await super.findOne(query);
}

  async create(data) {
    const mysqlData = this.transformToMySQL(data);
    return await super.create(mysqlData);
  }

  transformToMySQL(mongoData) {
    return {
      firstName: mongoData.fullNameCustomer?.firstName || mongoData.firstName,
      lastName: mongoData.fullNameCustomer?.lastName || mongoData.lastName,
      dateOfBirth: mongoData.dateOfBirth,
      sex: mongoData.sex,
      identityCardNumber: mongoData.identityCardNumber,
      address: mongoData.address,
      phoneNumber: mongoData.phoneNumber,
      email: mongoData.email,
      avatar: mongoData.avatar,
      userName: mongoData.loginInformation?.userName || mongoData.userName,
      password: mongoData.loginInformation?.password || mongoData.password,
      userType: mongoData.loginInformation?.type || mongoData.userType || 'User',
      roles: JSON.stringify(mongoData.loginInformation?.roles || mongoData.roles || []),
      status: mongoData.loginInformation?.status !== false,
      listProduct: JSON.stringify(mongoData.listProduct || []),
      listFavorite: JSON.stringify(mongoData.listFavorite || [])
    };
  }

  transformToMongo(mysqlData) {
  if (!mysqlData) return null;
  
  let roles = [];
  try {
    if (mysqlData.roles) {
      if (typeof mysqlData.roles === 'string') {
        // Xử lý JSON string
        if (mysqlData.roles.trim().startsWith('[') || mysqlData.roles.trim().startsWith('{')) {
          roles = JSON.parse(mysqlData.roles);
        } else {
          // Nếu không phải JSON hợp lệ, xử lý như mảng đơn giản
          roles = mysqlData.roles.split(',').map(r => r.trim()).filter(r => r);
        }
      } else {
        roles = mysqlData.roles;
      }
    }
  } catch (error) {
    console.error('❌ Lỗi parse roles customer:', error.message);
    console.log('Raw roles data:', mysqlData.roles);
    roles = ['Normal']; // Giá trị mặc định
  }
  
  // Xử lý listProduct và listFavorite
  let listProduct = [];
  let listFavorite = [];
  
  try {
    if (mysqlData.listProduct) {
      if (typeof mysqlData.listProduct === 'string') {
        listProduct = JSON.parse(mysqlData.listProduct);
      } else {
        listProduct = mysqlData.listProduct;
      }
    }
  } catch (error) {
    console.error('❌ Lỗi parse listProduct:', error.message);
    listProduct = [];
  }
  
  try {
    if (mysqlData.listFavorite) {
      if (typeof mysqlData.listFavorite === 'string') {
        listFavorite = JSON.parse(mysqlData.listFavorite);
      } else {
        listFavorite = mysqlData.listFavorite;
      }
    }
  } catch (error) {
    console.error('❌ Lỗi parse listFavorite:', error.message);
    listFavorite = [];
  }
  
  return {
    _id: mysqlData._id,
    fullNameCustomer: {
      firstName: mysqlData.firstName,
      lastName: mysqlData.lastName
    },
    dateOfBirth: mysqlData.dateOfBirth,
    sex: mysqlData.sex,
    identityCardNumber: mysqlData.identityCardNumber,
    address: mysqlData.address,
    phoneNumber: mysqlData.phoneNumber,
    email: mysqlData.email,
    listProduct: listProduct,
    listFavorite: listFavorite,
    loginInformation: {
      userName: mysqlData.userName,
      password: mysqlData.password,
      type: mysqlData.userType,
      roles: roles,
      status: mysqlData.status
    },
    avatar: mysqlData.avatar,
    createdAt: mysqlData.createdAt,
    updatedAt: mysqlData.updatedAt
  };
}

  async find(query = {}) {
    const rows = await super.find(query);
    return rows.map(row => this.transformToMongo(row));
  }

  async findOne(query) {
    const row = await super.findOne(query);
    return this.transformToMongo(row);
  }

  async findById(id) {
    const row = await super.findById(id);
    return this.transformToMongo(row);
  }

  async updateCart(userId, productData) {
    const customer = await super.findById(userId);
    if (!customer) return null;

    let listProduct = customer.listProduct ? JSON.parse(customer.listProduct) : [];
    listProduct.push(productData);

    return await super.findByIdAndUpdate(userId, {
      listProduct: JSON.stringify(listProduct)
    });
  }

  async updateFavorites(userId, productData) {
    const customer = await super.findById(userId);
    if (!customer) return null;

    let listFavorite = customer.listFavorite ? JSON.parse(customer.listFavorite) : [];
    listFavorite.push(productData);

    return await super.findByIdAndUpdate(userId, {
      listFavorite: JSON.stringify(listFavorite)
    });
  }

  async updateCartItem(userId, productId, quantity) {
    const customer = await super.findById(userId);
    if (!customer) return null;

    let listProduct = customer.listProduct ? JSON.parse(customer.listProduct) : [];
    const updatedProducts = listProduct.map(item => {
      if (item.productID === productId) {
        return { ...item, amount: quantity };
      }
      return item;
    });

    return await super.findByIdAndUpdate(userId, {
      listProduct: JSON.stringify(updatedProducts)
    });
  }

  async removeFromCart(userId, productId) {
    const customer = await super.findById(userId);
    if (!customer) return null;

    let listProduct = customer.listProduct ? JSON.parse(customer.listProduct) : [];
    const updatedProducts = listProduct.filter(item => item.productID !== productId);

    return await super.findByIdAndUpdate(userId, {
      listProduct: JSON.stringify(updatedProducts)
    });
  }

  async removeFromFavorites(userId, productId) {
    const customer = await super.findById(userId);
    if (!customer) return null;

    let listFavorite = customer.listFavorite ? JSON.parse(customer.listFavorite) : [];
    const updatedFavorites = listFavorite.filter(item => item._id.toString() !== productId);

    return await super.findByIdAndUpdate(userId, {
      listFavorite: JSON.stringify(updatedFavorites)
    });
  }
}

module.exports = new Customer();