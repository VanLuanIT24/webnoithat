// models/products.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        imageList: [String],
        productDescription: String,
        price: {
            type: Number,
            required: true,
            min: 0
        },
        supplierCode: String,
        typeCode: String,
        status: {
            type: Boolean,
            default: true
        },
        unit: {
            type: String,
            default: "Cái"
        },
        stock: {
            type: Number,
            default: 0,
            min: 0
        },
        featured: {
            type: Boolean,
            default: false
        },
        inStock: {
            type: Boolean,
            default: true
        }
    },
    discount: {
        type: {
            type: String,
            enum: ['none', 'percent', 'fixed'],
            default: 'none'
        },
        value: {
            type: Number,
            default: 0,
            min: 0
        },
        endDate: {
            type: Date,
            default: null
        }
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0,
            min: 0
        },
        distribution: {
            type: [Number],
            default: [0, 0, 0, 0, 0] // [1-star, 2-star, 3-star, 4-star, 5-star]
        }
    }
}, { 
    versionKey: false,
    timestamps: true 
});

module.exports = mongoose.model('products', productSchema);