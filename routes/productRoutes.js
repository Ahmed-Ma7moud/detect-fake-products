// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  buyProduct,
  sellProduct,
  productHistory,
  getNearestLocations
} = require('../controllers/productController');
const rateLimiter = require("../middleware/rateLimiter")
const {authenticate , authorize} = require("../middleware/auth")
const {uuidValidation}= require("../middleware/validators/product")

router.use(rateLimiter.apiLimiter)

// public routes
router.get("/history/:id" , uuidValidation , productHistory)
router.get("/nearest" , getNearestLocations)
router.get("/:id", uuidValidation , getProduct); 

// restricted routes
router.use(authenticate)
router.post("/buy/:id" , uuidValidation , authorize('pharmacy') , buyProduct); 
router.post("/sell/:id" , uuidValidation , authorize('pharmacy') , sellProduct);
router.get("/", authorize('manufacturer', 'supplier', 'pharmacy'), getProducts);
module.exports = router;