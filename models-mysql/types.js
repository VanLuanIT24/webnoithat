// models-mysql/types.js - THÊM METHOD MỚI
const BaseModel = require('./baseModel');

class Type extends BaseModel {
  constructor() {
    super('types');
  }

  // Thêm method để lấy danh mục active
  async findActive() {
    try {
      return await this.find({ status: true });
    } catch (error) {
      console.error("Error in findActive:", error);
      return [];
    }
  }
}

module.exports = new Type();