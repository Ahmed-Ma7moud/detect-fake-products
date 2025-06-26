// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  addBatch,
  getProducts,
  getProduct,
  getSoldProducts,
  receiveBatch,
  buyProduct,
  sellProduct,
  productHistory,
  getBatches,
  getNearestLocations
} = require('../controllers/productController');
const rateLimiter = require("../middleware/rateLimiter")
const {authenticate , authorize} = require("../middleware/auth")
const {addBatchValidation , idValidation , batchValidation} 
= require("../middleware/validators/product")
// public routes
router.use(rateLimiter.apiLimiter)
router.get("/history/:id" , idValidation , productHistory)
router.get("/nearest" , getNearestLocations)

// restricted routes
router.get("/batches" , authenticate , authorize("manufacturer"), getBatches)
router.get("/sold" , authenticate , getSoldProducts)

// public route 
router.get("/:id", idValidation , getProduct); 

// restricted routes
router.use(authenticate)
router.post("/add", addBatchValidation , authorize('manufacturer') , addBatch); 
router.post("/receive/:batch" , batchValidation , authorize('supplier') , receiveBatch); 
router.post("/buy/:id" , idValidation , authorize('pharmacy') , buyProduct); 
router.post("/sell/:id" , idValidation , authorize('pharmacy') , sellProduct);
router.get("/",getProducts);
module.exports = router;