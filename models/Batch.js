const mongoose = require ("mongoose")

const batchSchema = new mongoose.Schema({
    factory : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
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
    status : {
        type : String,
        enum : ['available', 'unavailable' , 'sold'],
        default : 'available'
    }
},{
  versionKey: false
})

module.exports = mongoose.model('Batch', batchSchema);