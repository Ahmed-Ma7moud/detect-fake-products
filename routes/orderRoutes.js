const router = require('express').Router();
const {authenticate, authorize} = require('../middleware/auth');
const {createOrder, getOrders, getOrder, updateOrderStatus , deleteOrder} = 
require('../controllers/orderController');

router.use(authenticate)

router.post('/', authorize('manufacturer'), createOrder);
router.get('/', authorize('manufacturer', 'supplier'), getOrders);  
router.get('/:id', authorize('manufacturer', 'supplier'), getOrder);
router.put('/status', authorize('supplier'), updateOrderStatus);
router.delete('/cancel' , authorize("manufacturer") , deleteOrder)
module.exports = router;