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
        type : [{
            serialNumber : {
                type : String,
            },
            sold : {
                type : Boolean,
                default : false
            },
            _id: false
        }],
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
        enum : ['pending', 'received', 'delivered'],
        default : 'pending'
    }
},{
  versionKey: false
})

module.exports = mongoose.model('Batch', batchSchema);