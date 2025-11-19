// models-mysql/suppliers.js
const BaseModel = require('./baseModel');

class Supplier extends BaseModel {
  constructor() {
    super('suppliers');
  }
}

module.exports = new Supplier();