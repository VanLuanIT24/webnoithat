// models-mysql/baseModel.js
const db = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db; // Thêm reference đến database
  }

  async find(query = {}) {
  let sql = `SELECT * FROM ${this.tableName}`;
  const params = [];
  
  if (Object.keys(query).length > 0) {
    const conditions = [];
    for (const [key, value] of Object.entries(query)) {
      // Xử lý các toán tử MongoDB
      if (typeof value === 'object') {
        if (value.$ne) {
          conditions.push(`${key} != ?`);
          params.push(value.$ne);
        } else if (value.$nin) {
          const placeholders = value.$nin.map(() => '?').join(',');
          conditions.push(`${key} NOT IN (${placeholders})`);
          params.push(...value.$nin);
        }
      } else {
        // Xử lý các trường đặc biệt
        if (key === 'userName') {
          conditions.push(`userName = ?`);
        } else if (key === 'loginInformation.userName') {
          conditions.push(`userName = ?`);
        } else if (key.includes('.')) {
          const [field, jsonKey] = key.split('.');
          if (['description', 'discount', 'rating', 'roles', 'listProduct', 'listFavorite', 'Districts'].includes(field)) {
            conditions.push(`JSON_EXTRACT(${field}, '$.${jsonKey}') = ?`);
          } else {
            conditions.push(`${field} = ?`);
          }
        } else {
          conditions.push(`${key} = ?`);
        }
        params.push(value);
      }
    }
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  const result = await this.db.query(sql, params);
  return result;
}

// Thêm vào BaseModel
async findWithLimit(query = {}, limit = 10, skip = 0) {
  let sql = `SELECT * FROM ${this.tableName}`;
  const params = [];
  
  if (Object.keys(query).length > 0) {
    const conditions = [];
    for (const [key, value] of Object.entries(query)) {
      if (key.includes('.')) {
        const [field, jsonKey] = key.split('.');
        conditions.push(`JSON_EXTRACT(${field}, '$.${jsonKey}') = ?`);
      } else {
        conditions.push(`${key} = ?`);
      }
      params.push(value);
    }
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  sql += ` LIMIT ${skip}, ${limit}`;
  
  return await this.db.query(sql, params);
}

  async findOne(query) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    
    if (query) {
      const conditions = [];
      for (const [key, value] of Object.entries(query)) {
        // XỬ LÝ CÁC TRƯỜNG ĐẶC BIỆT
        if (key === 'userName') {
          conditions.push(`userName = ?`);
        } else if (key === 'loginInformation.userName') {
          // SỬA: Dùng trường userName trực tiếp thay vì JSON_EXTRACT
          conditions.push(`userName = ?`);
        } else if (key.includes('.')) {
          const [field, jsonKey] = key.split('.');
          // Chỉ sử dụng JSON_EXTRACT cho các trường thực sự là JSON
          if (['description', 'discount', 'rating', 'roles', 'listProduct', 'listFavorite', 'Districts'].includes(field)) {
            conditions.push(`JSON_EXTRACT(${field}, '$.${jsonKey}') = ?`);
          } else {
            // Với các trường khác, tìm kiếm trực tiếp
            conditions.push(`${field} = ?`);
          }
        } else {
          conditions.push(`${key} = ?`);
        }
        params.push(value);
      }
      sql += ` WHERE ${conditions.join(' AND ')} LIMIT 1`;
    }
    
    const result = await this.db.query(sql, params);
    return result[0] || null;
  }

  async findById(id) {
    return await this.findOne({ _id: id });
  }

  async create(data) {
    return await this.db.insert(this.tableName, data);
  }

  async findByIdAndUpdate(id, data) {
    return await this.db.update(this.tableName, data, '_id = ?', [id]);
  }

  async findOneAndUpdate(query, data) {
    const item = await this.findOne(query);
    if (!item) return null;
    
    return await this.findByIdAndUpdate(item._id, data);
  }

  async findByIdAndDelete(id) {
    return await this.db.delete(this.tableName, '_id = ?', [id]);
  }

  async findOneAndDelete(query) {
    const item = await this.findOne(query);
    if (!item) return null;
    
    return await this.findByIdAndDelete(item._id);
  }

  async countDocuments(query = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];
    
    if (Object.keys(query).length > 0) {
      const conditions = [];
      for (const [key, value] of Object.entries(query)) {
        if (key.includes('.')) {
          const [field, jsonKey] = key.split('.');
          conditions.push(`JSON_EXTRACT(${field}, '$.${jsonKey}') = ?`);
        } else {
          conditions.push(`${key} = ?`);
        }
        params.push(value);
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const result = await this.db.query(sql, params);
    return result[0]?.count || 0;
  }

  // Thêm method limit
  async findWithLimit(query = {}, limit = 10, skip = 0) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    
    if (Object.keys(query).length > 0) {
      const conditions = [];
      for (const [key, value] of Object.entries(query)) {
        if (key.includes('.')) {
          const [field, jsonKey] = key.split('.');
          conditions.push(`JSON_EXTRACT(${field}, '$.${jsonKey}') = ?`);
        } else {
          conditions.push(`${key} = ?`);
        }
        params.push(value);
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` LIMIT ${skip}, ${limit}`;
    
    return await this.db.query(sql, params);
  }
}

module.exports = BaseModel;