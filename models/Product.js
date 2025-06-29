const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  factory : {
    type : mongoose.Schema.ObjectId,
    ref : "User",
    required : true
  },
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  owner : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User",
    required : true
  },
  location:{
    type: String,
    required:true
  },
  sold:{
    type : Boolean,
    default:false
  },
  productionDate: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setHours(now.getHours() + 3); // +3 summer +2 winter
      return now;
    }
  },
  expirationDate: {
    type: Date,
    required: true,
    default: function () {
      const prodDate = this.productionDate || new Date();
      const expiration = new Date(prodDate);
      expiration.setFullYear(expiration.getFullYear() + 3);
      return expiration;
    }
  }
},{
  versionKey: false
});

module.exports = mongoose.model('Product', ProductSchema);
