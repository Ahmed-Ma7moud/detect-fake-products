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
router.use(rateLimiter.apiLimiter)
router.get("/history/:id" , productHistory)
router.use(authMiddleware.authenticate)
router.get("/",getProducts);
router.get("/:id",getProduct); 
router.post("/add", authMiddleware.authorize('manufacturer') , addProduct); 
router.post("/receive/:id" , authMiddleware.authorize('supplier') , receiveBatch); 
router.post("/buy/:id" , authMiddleware.authorize('pharmacy') , buyProduct); 
router.post("/sell/:id" , authMiddleware.authorize('pharmacy') , sellProduct);
module.exports = router;