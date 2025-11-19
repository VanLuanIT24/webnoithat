// controllers/CategoriesController.js
const product = require("../models-mysql/products");
const supplier = require("../models-mysql/suppliers");
const type = require("../models-mysql/types");

class CategoriesController {
  async getList(req, res, next) {
    try {
      const id = req.params.id;
      const itemsPerPage = 6;
      req.session.idCategories = id;
      
      const [result, supllierResult, typeResult] = await Promise.all([
        product.find({ "description.typeCode": id }),
        supplier.find({}),
        type.findById(id)
      ]);

      res.render("categories-list-item", {
        suppliers: supllierResult,
        products: result,
        type: typeResult,
        itemsPerPage: itemsPerPage,
        currentPage: 1
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }

  async getListAtPage(req, res, next) {
    try {
      const id = req.session.idCategories;
      const itemsPerPage = 6;
      const currentPage = req.params.page;
      
      const [result, supllierResult, typeResult] = await Promise.all([
        product.find({ "description.typeCode": id }),
        supplier.find({}),
        type.findById(id)
      ]);

      res.render("categories-list-item", {
        suppliers: supllierResult,
        products: result,
        type: typeResult,
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi server');
    }
  }
}

module.exports = new CategoriesController();