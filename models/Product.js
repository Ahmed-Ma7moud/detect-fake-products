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
    type : String,
    ref : "User",
    required : true
  },
  location:{
    type: String,
    default : "unknown",
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
});

module.exports = mongoose.model('Product', ProductSchema);
