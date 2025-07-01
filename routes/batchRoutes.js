const express = require('express');
const router = express.Router();
const {
    addBatch,
    getBatchById,
    getBatches,
    deleteBatch,
    receiveBatch,
    factorySupplierBatches,
    deliverBatch
} = require("../controllers/batchController")

const {authenticate , authorize} = require("../middleware/auth")

router.use(authenticate)

router.post('/' , authorize("manufacturer") , addBatch)
router.get('/' , authorize("manufacturer" , "supplier") , getBatches)
router.get('/orders/:supplierId' , authorize("manufacturer") , factorySupplierBatches)
router.get('/:id' , authorize("manufacturer" , "supplier") , getBatchById)
router.delete('/:id' , authorize("manufacturer") , deleteBatch)
router.post('/receive/:batchId' , authorize("supplier") , receiveBatch)
router.put('/deliver/:batchId' , authorize("supplier") , deliverBatch)
module.exports = router