const BaseModel = require('./baseModel');

class Product extends BaseModel {
  constructor() {
    super('products');
  }

  transformToMySQL(mongoData) {
    return {
      productName: mongoData.productName,
      description: JSON.stringify(mongoData.description || {}),
      discount: JSON.stringify(mongoData.discount || {}),
      rating: JSON.stringify(mongoData.rating || {})
    };
  }

  transformToMongo(mysqlData) {
  if (!mysqlData) return null;
  
  let description = {};
  let discount = {};
  let rating = {};
  
  try {
    if (mysqlData.description) {
      if (typeof mysqlData.description === 'string') {
        description = JSON.parse(mysqlData.description);
      } else {
        description = mysqlData.description;
      }
    }
  } catch (error) {
    console.error('❌ Lỗi parse product description:', error.message);
    description = {};
  }
  
  try {
    if (mysqlData.discount) {
      if (typeof mysqlData.discount === 'string') {
        discount = JSON.parse(mysqlData.discount);
      } else {
        discount = mysqlData.discount;
      }
    }
  } catch (error) {
    console.error('❌ Lỗi parse product discount:', error.message);
    discount = {};
  }
  
  try {
    if (mysqlData.rating) {
      if (typeof mysqlData.rating === 'string') {
        rating = JSON.parse(mysqlData.rating);
      } else {
        rating = mysqlData.rating;
      }
    }
  } catch (error) {
    console.error('❌ Lỗi parse product rating:', error.message);
    rating = {};
  }
  
  return {
    _id: mysqlData._id,
    productName: mysqlData.productName,
    description: description,
    discount: discount,
    rating: rating,
    createdAt: mysqlData.createdAt,
    updatedAt: mysqlData.updatedAt
  };
}

// Sửa method find để đảm bảo consistency
async find(query = {}, limit = 10) {
  try {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    
    if (Object.keys(query).length > 0) {
      const conditions = [];
      for (const [key, value] of Object.entries(query)) {
        if (key === 'description.status') {
          conditions.push(`JSON_EXTRACT(description, '$.status') = ?`);
          params.push(value);
        } else if (key === 'description.featured') {
          conditions.push(`JSON_EXTRACT(description, '$.featured') = ?`);
          params.push(value);
        } else if (key.includes('.')) {
          const [field, jsonKey] = key.split('.');
          conditions.push(`JSON_EXTRACT(${field}, '$.${jsonKey}') = ?`);
          params.push(value);
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
  } catch (error) {
    console.error("Error in product.find:", error);
    return [];
  }
}


// models-mysql/products.js - THÊM METHOD MỚI
async findFeatured(limit = 12) {
  try {
    let sql = `SELECT * FROM ${this.tableName} WHERE JSON_EXTRACT(description, '$.status') = true`;
    
    // Ưu tiên sản phẩm featured
    sql += ` AND JSON_EXTRACT(description, '$.featured') = true`;
    sql += ` ORDER BY createdAt DESC LIMIT ${limit}`;
    
    let rows = await this.db.query(sql);
    
    // Nếu không có featured, lấy sản phẩm mới nhất
    if (!rows || rows.length === 0) {
      sql = `SELECT * FROM ${this.tableName} WHERE JSON_EXTRACT(description, '$.status') = true`;
      sql += ` ORDER BY createdAt DESC LIMIT ${limit}`;
      rows = await this.db.query(sql);
    }
    
    return rows.map(row => this.transformToMongo(row));
  } catch (error) {
    console.error("Error in findFeatured:", error);
    return [];
  }
}

async findWithLimit(query = {}, limit = 10, skip = 0) {
  let sql = `SELECT * FROM ${this.tableName}`;
  const params = [];
  
  if (Object.keys(query).length > 0) {
    const conditions = [];
    for (const [key, value] of Object.entries(query)) {
      if (key === 'description.status') {
        conditions.push(`JSON_EXTRACT(description, '$.status') = ?`);
        params.push(value);
      } else if (key.includes('.')) {
        const [field, jsonKey] = key.split('.');
        conditions.push(`JSON_EXTRACT(${field}, '$.${jsonKey}') = ?`);
        params.push(value);
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  sql += ` ORDER BY createdAt DESC LIMIT ${skip}, ${limit}`;
  
  const rows = await this.db.query(sql, params);
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

  // Special methods for products
  async findByType(typeCode) {
    return await this.find({ 'description.typeCode': typeCode });
  }

  async findBySupplier(supplierCode) {
    return await this.find({ 'description.supplierCode': supplierCode });
  }

  async findFeatured() {
    return await this.find({ 'description.featured': true });
  }

  async searchByName(keyword) {
    // SỬA: Dùng this.db thay vì require lại
    const sql = `SELECT * FROM products WHERE productName LIKE ?`;
    const rows = await this.db.query(sql, [`%${keyword}%`]);
    return rows.map(row => this.transformToMongo(row));
  }

  async countDocuments(query = {}) {
    return await super.countDocuments(query);
  }
}

module.exports = new Product();