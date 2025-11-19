const BaseModel = require('./baseModel');

class Admin extends BaseModel {
  constructor() {
    super('admins');
  }

  async findOne(query) {
    // XỬ LÝ TRƯỜNG ĐẶC BIỆT: loginInformation.userName -> userName
    if (query['loginInformation.userName']) {
      return await super.findOne({ userName: query['loginInformation.userName'] });
    }
    return await super.findOne(query);
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
    const row = await super.findOne(query);
    return this.transformToMongo(row);
  }

  async findById(id) {
    const row = await super.findById(id);
    return this.transformToMongo(row);
  }
}

module.exports = new Admin();