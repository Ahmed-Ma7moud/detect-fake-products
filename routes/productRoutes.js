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

router.use(rateLimiter.apiLimiter)

// public routes
router.get("/history/:id" , productHistory)
router.get("/nearest/:name" , getNearestLocations)
router.get("/:id" , getProduct); 

// restricted routes
router.use(authenticate)
router.post("/buy/:id"  , authorize('pharmacy') , buyProduct); 
router.post("/sell/:id"  , authorize('pharmacy') , sellProduct);
router.get("/", authorize('manufacturer', 'supplier', 'pharmacy'), getProducts);
module.exports = router;