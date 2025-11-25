const BaseModel = require('./baseModel');

class Admin extends BaseModel {
  constructor() {
    super('admins');
  }

  transformToMySQL(mongoData) {
    return {
      firstName: mongoData.fullNameCustomer?.firstName,
      lastName: mongoData.fullNameCustomer?.lastName,
      dateOfBirth: mongoData.dateOfBirth,
      sex: mongoData.sex,
      identityCardNumber: mongoData.identityCardNumber,
      address: mongoData.address,
      phoneNumber: mongoData.phoneNumber,
      email: mongoData.email,
      avatar: mongoData.avatar,
      userName: mongoData.loginInformation?.userName,
      password: mongoData.loginInformation?.password,
      userType: mongoData.loginInformation?.type || 'Admin',
      roles: JSON.stringify(mongoData.loginInformation?.roles || [])
    };
  }

  transformToMongo(mysqlData) {
    if (!mysqlData) return null;
    
    let roles = [];
    try {
      if (mysqlData.roles) {
        if (typeof mysqlData.roles === 'string') {
          roles = JSON.parse(mysqlData.roles);
        } else {
          roles = mysqlData.roles;
        }
      }
    } catch (error) {
      console.error('❌ Lỗi parse roles:', error.message);
      roles = [];
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
      loginInformation: {
        userName: mysqlData.userName,
        password: mysqlData.password,
        type: mysqlData.userType,
        roles: roles
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
    // XỬ LÝ TRƯỜNG ĐẶC BIỆT: loginInformation.userName -> userName
    let searchQuery = query;
    if (query['loginInformation.userName']) {
      searchQuery = { userName: query['loginInformation.userName'] };
    }
    
    const row = await super.findOne(searchQuery);
    // BUG FIX: baseModel.findOne() trả về array, phải lấy phần tử đầu tiên
    if (!row || (Array.isArray(row) && row.length === 0)) return null;
    const actualRow = Array.isArray(row) ? row[0] : row;
    return this.transformToMongo(actualRow);
  }

  async findById(id) {
    const row = await super.findById(id);
    return this.transformToMongo(row);
  }
}

module.exports = new Admin();