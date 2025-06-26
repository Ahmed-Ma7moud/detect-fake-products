const mongoose = require('mongoose');
const contractSchema = new mongoose.Schema({
  factory : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplier : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  contractDate: {
    type: Date,
    default: Date.now
  },
},{
  versionKey: false 
});
module.exports = mongoose.model('Contract', contractSchema);