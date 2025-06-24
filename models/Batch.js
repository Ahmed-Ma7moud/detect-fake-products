const mongoose = require ("mongoose")

const batchSchema = new mongoose.Schema({
    owner : {
        type : String,
        ref : "User",
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
    createdAt : {
        type: Date,
        default: function() {
            const egyptDate = new Date();
            // Egypt is UTC+2 in winter and UTC+3 in summer
            egyptDate.setHours(egyptDate.getHours() + 3);
            return egyptDate;
        }
    }
})

module.exports = mongoose.model('Batch', batchSchema);