// models/customers.js
const mongoose = require('mongoose');

const customer = new mongoose.Schema({
    fullNameCustomer: {
        firstName: String,
        lastName: String
    },
    dateOfBirth: String,
    sex: String,
    identityCardNumber: String,
    address: String,
    phoneNumber: String,
    email: String,
    listProduct: Array,
    listFavorite: Array,
    loginInformation: {
        userName: String,
        password: String,
        type: { type: String, default: 'User' },
        roles: Array,
        status: { type: Boolean, default: true }
    },
    avatar: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},{ versionKey: null });

module.exports = mongoose.model('customers', customer);