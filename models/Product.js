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
  sold:{
    type : Boolean,
    default:false
  },
  production_date: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setHours(now.getHours() + 3); // +3 summer +2 winter
      return now;
    }
  },
  expiration_date: {
    type: Date,
    required: true,
    default: function () {
      const prodDate = this.production_date || new Date();
      const expiration = new Date(prodDate);
      expiration.setFullYear(expiration.getFullYear() + 3);
      return expiration;
    }
  }
});

module.exports = mongoose.model('Product', ProductSchema);
