// models-mysql/regions.js
const BaseModel = require('./baseModel');

class Region extends BaseModel {
  constructor() {
    super('regions');
  }

  transformToMySQL(mongoData) {
    return {
      Id: mongoData.Id,
      Name: mongoData.Name,
      Districts: JSON.stringify(mongoData.Districts || [])
    };
  }

  transformToMongo(mysqlData) {
    if (!mysqlData) return null;
    
    let Districts = [];
    try {
      if (mysqlData.Districts) {
        if (typeof mysqlData.Districts === 'string') {
          // Kiểm tra xem có phải là JSON string hợp lệ không
          const trimmed = mysqlData.Districts.trim();
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            Districts = JSON.parse(mysqlData.Districts);
          } else {
            console.warn('⚠️ Districts data is not valid JSON:', mysqlData.Districts);
            Districts = [];
          }
        } else if (Array.isArray(mysqlData.Districts)) {
          Districts = mysqlData.Districts;
        }
      }
    } catch (error) {
      console.error('❌ Lỗi parse Districts:', error.message);
      console.log('Raw Districts data:', mysqlData.Districts);
      Districts = [];
    }
    
    return {
      _id: mysqlData._id,
      Id: mysqlData.Id,
      Name: mysqlData.Name,
      Districts: Districts,
      createdAt: mysqlData.createdAt
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

  // Special methods for regions
  async findByIdRegion(regionId) {
    return await this.findOne({ Id: regionId });
  }
}

module.exports = new Region();