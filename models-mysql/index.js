// models-mysql/index.js
const types = require('./types');
const suppliers = require('./suppliers');
const products = require('./products');
const customers = require('./customers');
const bills = require('./bills');
const regions = require('./regions');
const admins = require('./admins');

module.exports = {
  types,
  suppliers,
  products,
  customers,
  bills,
  regions,
  admins
};