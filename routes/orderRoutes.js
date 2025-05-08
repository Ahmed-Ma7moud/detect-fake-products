// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  getOrders,
  getTransactions,
  confirmation
} = require('../controllers/orderController');
const authMiddleware = require("../middleware/auth")
router.use(authMiddleware.authenticate)
router.get("/" , getOrders); // fetch pending orders
router.patch("/confirm" , confirmation); // update order and product
router.get("/transactions" , getTransactions); // fetch transactions

module.exports = router;