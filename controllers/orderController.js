const Order = require('../models/Order');
const Contract = require('../models/Contract');
const Batch = require('../models/Batch');
const mongoose = require('mongoose');
exports.createOrder = async (req, res) => {
  try {
    const {supplierID, batchNumber } = req.body;

    if (!supplierID || !batchNumber) {
      return res.status(400).
      json({ success: false, msg: "Missing required fields" });
    }

    if(!mongoose.Types.ObjectId.isValid(supplierID)){
      return res.status(400).
      json({ success: false, msg: "Invalid supplier ID" });
    }

    // Check if factory and supplier have a valid contract
    const contract = await Contract.findOne({
      factory: req.user.id,
      supplier: supplierID,
      status: 'accepted'
    });
    if (!contract) {
      return res.status(400).json({ success: false, msg: "No valid contract found" });
    }

    // Check ownership of the batch
    const batch = await Batch.findOne({ batchNumber , factory: req.user.id  , status : "avaliable"});
    if (!batch) {
      return res.status(400).json({ success: false, msg: "You do not own this batch" });
    }

    //create the order
    const newOrder = await Order.create({
      factory: req.user.id,
      supplier: supplierID,
      batchNumber : batch._id
    });

    if (!newOrder) {
      return res.status(500).json({ success: false, msg: "Failed to create order" });
    }

    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
}

// Delete order if not accepted by the supplier
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ success: false, msg: "Missing order ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, msg: "Invalid order ID" });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }
    if(order.status != "pending"){
        return res.status(404).json({ success: false, msg: "You can not cancel this order" });
    }
    // Check if the order is pending and belongs to the factory
    if (order.factory.toString() !== req.user.id) {
      return res.status(403).json({ success: false, msg: "Unauthorized to delete this order" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, msg: "Can not delete order" });
    }

    // Delete the order
    await order.remove();

    res.status(200).json({ success: true, msg: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
}

exports.getOrders = async (req, res) => {
  try {
    let orders = [];
    if (req.user.role === 'manufacturer') {
      orders = await Order.find({ factory: req.user.id })
        .populate('supplier', 'tradeName email location')
        .populate('batchNumber', 'medicineName batchNumber quantity price')
        .select('-__v -factory');
    } else if (req.user.role === 'supplier') {
      orders = await Order.find({ supplier: req.user.id })
        .populate('factory', 'tradeName email location')
        .populate('batchNumber', 'medicineName batchNumber quantity price')
        .select('-__v -supplier');
    }

    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
}

exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ success: false, msg: "Missing order ID" });
    } 

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, msg: "Invalid order ID" });
    }
    // Find the order
    let order;
    if (req.user.role === 'manufacturer') {
      order = await Order.findById(orderId)
        .populate('supplier', 'tradeName email location')
        .populate('batchNumber', 'medicineName batchNumber quantity price')
        .select('-__v');
    } else if (req.user.role === 'supplier') {
      order = await Order.findById(orderId)
        .populate('factory', 'tradeName email location')
        .populate('batchNumber', 'batchNumber productName quantity price')
        .select('-__v');
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
}

// update order status if accepted the factory will sent the order to the supplier
// if not okay the supplier will reject the order
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, msg: "Missing required fields" });
    }

    if(mongoose.Types.ObjectId.isValid(orderId) === false) {
      return res.status(400).json({ success: false, msg: "Invalid order ID" });
    }

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status" });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    if(order.status !== 'pending') {
      return res.status(400).json({ success: false, msg: "Can not update order status" });
    }

    if (order.supplier.toString() !== req.user.id) {
      return res.status(403).json({ success: false, msg: "Unauthorized to update this order" });
    }

    // Update the order status
    order.status = status;
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, msg: `Server error: ${err.message}` });
  }
} 