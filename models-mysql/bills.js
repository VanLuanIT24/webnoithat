// models-mysql/bills.js
const BaseModel = require('./baseModel');

class Bill extends BaseModel {
  constructor() {
    super('bills');
  }

  transformToMySQL(mongoData) {
    return {
      userID: mongoData.userID,
      firstName: mongoData.displayName?.firstName,
      lastName: mongoData.displayName?.lastName,
      listProduct: JSON.stringify(mongoData.listProduct || []),
      address: mongoData.address,
      paymentMethod: mongoData.paymentMethod,
      resquest: mongoData.resquest,
      status: mongoData.status,
      phoneNumber: mongoData.phoneNumber,
      email: mongoData.email,
      createdAt: mongoData.createdAt || new Date(),
      updatedAt: mongoData.updatedAt || new Date()
    };
  }

  transformToMongo(mysqlData) {
    if (!mysqlData) return null;
    
    let listProduct = [];
    
    try {
      if (mysqlData.listProduct) {
        if (typeof mysqlData.listProduct === 'string') {
          const trimmed = mysqlData.listProduct.trim();
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            listProduct = JSON.parse(mysqlData.listProduct);
          } else {
            console.warn('⚠️ listProduct không phải JSON hợp lệ:', mysqlData.listProduct);
            listProduct = [];
          }
        } else if (Array.isArray(mysqlData.listProduct)) {
          listProduct = mysqlData.listProduct;
        }
      }
    } catch (error) {
      console.error('❌ Lỗi parse listProduct trong bill:', error.message);
      console.log('Raw listProduct data:', mysqlData.listProduct);
      listProduct = [];
    }
    
    return {
      _id: mysqlData._id,
      userID: mysqlData.userID,
      displayName: {
        firstName: mysqlData.firstName || '',
        lastName: mysqlData.lastName || ''
      },
      listProduct: listProduct,
      address: mysqlData.address || '',
      paymentMethod: mysqlData.paymentMethod || 'Thanh toán khi nhận hàng',
      resquest: mysqlData.resquest || '',
      status: mysqlData.status || 'Chờ xác nhận',
      phoneNumber: mysqlData.phoneNumber || '',
      email: mysqlData.email || '',
      createdAt: mysqlData.createdAt,
      updatedAt: mysqlData.updatedAt
    };
  }

  // Override find để transform data
  async find(query = {}) {
    const rows = await super.find(query);
    return rows.map(row => this.transformToMongo(row));
  }

  // Override findOne để transform data
  async findOne(query) {
    const row = await super.findOne(query);
    return this.transformToMongo(row);
  }

  // Override findById để transform data
  async findById(id) {
    const row = await super.findById(id);
    return this.transformToMongo(row);
  }

  // Thêm method limit để hỗ trợ
  async findWithLimit(query = {}, limit = 10) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    
    if (Object.keys(query).length > 0) {
      const conditions = [];
      for (const [key, value] of Object.entries(query)) {
        if (key === 'status' && typeof value === 'object') {
          if (value.$ne) {
            conditions.push(`status != ?`);
            params.push(value.$ne);
          } else if (value.$nin) {
            conditions.push(`status NOT IN (?)`);
            params.push(value.$nin);
          }
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY createdAt DESC LIMIT ${limit}`;
    
    const rows = await this.db.query(sql, params);
    return rows.map(row => this.transformToMongo(row));
  }

  // Special methods for bills
  async findByStatus(status) {
    return await this.find({ status });
  }

  async findByUserId(userId) {
    return await this.find({ userID: userId });
  }

  async updateStatus(billId, status) {
    return await this.findByIdAndUpdate(billId, { 
      status,
      updatedAt: new Date()
    });
  }

  // Override create để thêm timestamp
  async create(data) {
    const mysqlData = this.transformToMySQL({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await super.create(mysqlData);
  }

  // Override update để thêm timestamp
  async findByIdAndUpdate(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    return await super.findByIdAndUpdate(id, this.transformToMySQL(updateData));
  }
}

module.exports = new Bill();