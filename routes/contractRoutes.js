const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');

router.get('/history/:serialNumber', contractController.getProductHistory);
router.get('/status/:serialNumber', contractController.getProductStatus);
router.post('/check', contractController.checkProduct);

module.exports = router;
