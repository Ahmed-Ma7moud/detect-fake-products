const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
  },
  serial_number: {
    type: String,
    required: true,
    unique: true
  },
  batch_number: {
    type: String,
    required: true
  },
  owner : {
    type : String,
    required : true
  },
  location:{
    type: String,
    default : "Unknown",
    required:true
  },
  txHash: {
    type: String,
    unique: true
  },
  block_number : {
    type : Number
  },
  sold:{
    type : Boolean,
    default:false
  },
  production_date :{
    type : Date,
    default : Date.now()
  },
  expiration_date: {
    type: Date,
  }
});

module.exports = mongoose.model('Product', ProductSchema);
