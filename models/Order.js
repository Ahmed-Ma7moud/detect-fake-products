const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  factory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
    }
}, {
  versionKey: false
});

module.exports = mongoose.model('Order', orderSchema);