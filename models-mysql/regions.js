// models-mysql/regions.js
const BaseModel = require('./baseModel');

class Region extends BaseModel {
  constructor() {
    super('regions');
  }

  transformToMySQL(mongoData) {
    return {
      region: mongoData.Name || mongoData.region,
      details: JSON.stringify(mongoData.Districts || mongoData.details || [])
    };
  }

  transformToMongo(mysqlData) {
    if (!mysqlData) return null;
    
    let Districts = [];
    try {
      if (mysqlData.details) {
        if (typeof mysqlData.details === 'string') {
          // Kiểm tra xem có phải là JSON string hợp lệ không
          const trimmed = mysqlData.details.trim();
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            Districts = JSON.parse(mysqlData.details);
          } else {
            console.warn('⚠️ Districts data is not valid JSON:', mysqlData.details);
            Districts = [];
          }
        } else if (Array.isArray(mysqlData.details)) {
          Districts = mysqlData.details;
        }
      }
    } catch (error) {
      console.error('❌ Lỗi parse Districts:', error.message);
      console.log('Raw Districts data:', mysqlData.details);
      Districts = [];
    }
    
    return {
      _id: mysqlData._id,
      Id: mysqlData.region,
      Name: mysqlData.region,
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
    return await this.findOne({ region: regionId });
  }
}

module.exports = new Region();