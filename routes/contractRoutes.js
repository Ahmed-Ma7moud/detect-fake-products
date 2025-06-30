const router = require('express').Router();
const {authenticate, authorize} = require('../middleware/auth');
const {
    makeContract,
    getContracts,  
    getContractById, 
    updateContractStatus,
    deleteContract,
    getAllSuppliers
} = require('../controllers/contractController');

router.use(authenticate);
router.post('/', authorize("manufacturer") , makeContract);
router.get('/', authorize("manufacturer" , "supplier") , getContracts);
router.get('/suppliers', authorize("manufacturer") , getAllSuppliers);
router.get('/:id', authorize("manufacturer" , "supplier" , "admin") , getContractById);
router.delete('/:id', authorize("manufacturer" , "admin") , deleteContract);
router.put('/status', authorize("supplier") , updateContractStatus);
module.exports = router;