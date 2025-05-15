const mongoose = require('mongoose');

const order_schema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  location1: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    required: true
  },
  location2: {
    type: String,
    required: true,
    trim: true
  },
  product_name :{
    type : String
  },
  serial_number: {
    type: String,
    required: true
  },
  status : {
    type : String,
    enum : ['pending', 'success' , 'cancelled'],
    default : "pending",
    required : true
  },
  tx_hash: {
    type: String
  },
  created_at: {
    type: Date,
    default: () => Date.now()
  }
});

module.exports = mongoose.model('order', order_schema);
