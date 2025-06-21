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
  productHistory
} = require('../controllers/productController');
const rateLimiter = require("../middleware/rateLimiter")
const authMiddleware = require("../middleware/auth")
const {addProductValidation , idValidation} = require("../middleware/validators/product")
router.use(rateLimiter.apiLimiter)
router.get("/history/:id" , idValidation , productHistory)
router.use(authMiddleware.authenticate)
router.get("/",getProducts);
router.get("/:id", idValidation , getProduct); 
router.post("/add", addProductValidation , authMiddleware.authorize('manufacturer') , addProduct); 
router.post("/receive/:id" , idValidation , authMiddleware.authorize('supplier') , receiveBatch); 
router.post("/buy/:id" , idValidation , authMiddleware.authorize('pharmacy') , buyProduct); 
router.post("/sell/:id" , idValidation , authMiddleware.authorize('pharmacy') , sellProduct);
module.exports = router;