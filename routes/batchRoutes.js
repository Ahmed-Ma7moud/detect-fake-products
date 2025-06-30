const express = require('express');
const router = express.Router();
const {
    addBatch,
    getBatchById,
    getBatches,
    deleteBatch,
    receiveBatch,
    factorySupplierBatches
} = require("../controllers/batchController")

const {authenticate , authorize} = require("../middleware/auth")

router.use(authenticate)

router.post('/' , authorize("manufacturer") , addBatch)
router.get('/' , authorize("manufacturer" , "supplier") , getBatches)
router.get('/orders/:supplierId' , authorize("manufacturer") , factorySupplierBatches)
router.get('/:id' , authorize("manufacturer" , "supplier") , getBatchById)
router.delete('/:id' , authorize("manufacturer") , deleteBatch)
router.post('/receive/:id' , authorize("supplier") , receiveBatch)
module.exports = router