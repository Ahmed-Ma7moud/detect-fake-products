const mongoose = require ("mongoose")

const batchSchema = new mongoose.Schema({
    factory : {
        type : String,
        ref : "User",
        required : true
    },
    medicineName : {
        type : String,
        required : true
    },
    genericName : {
        type : String,
        required : true
    },
    quantity : {
        type : Number,
        required : true
    },

    price : {
        type : Number,
        required : true
    },
    batchNumber : {
        type : String,
        required : true,
        unique : true
    },
    products : {
        type : [String],
        required : true
    },
    productionDate : {
        type : Date
    },
    expirationDate : {
        type : Date
    },
},{
  versionKey: false
})

module.exports = mongoose.model('Batch', batchSchema);