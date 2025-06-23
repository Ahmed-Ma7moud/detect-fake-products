const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    seller : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : ture
    },
    buyer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : ture
    },
    serialNumber: {
        type: String,
        ref : "Product",
        required: true
    },
    productName : {
        type : String,
        required : true
    },
    time: {
        type: Date,
        default: function() {
            // Create date with Egypt time zone offset
            const egyptDate = new Date();
            // Egypt is UTC+2 in winter and UTC+3 in summer
            egyptDate.setHours(egyptDate.getHours() + 3);
            return egyptDate;
        }
}});

const Tracking = mongoose.model('Tracking', TrackingSchema);

module.exports = Tracking;