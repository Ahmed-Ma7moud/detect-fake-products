// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  addProduct,
  getProducts,
  getProduct,
  receiveBatch,
  buyProduct,
  sellProduct,
} = require('../controllers/productController');
const authMiddleware = require("../middleware/auth")
router.use(authMiddleware.authenticate)
router.get("/",getProducts);
router.get("/:id",getProduct); 
router.post("/add", addProduct); 
router.post("/receive/:id" , receiveBatch); 
router.post("/buy/:id" , buyProduct); 
router.post("/sell/:id" , sellProduct);
module.exports = router;