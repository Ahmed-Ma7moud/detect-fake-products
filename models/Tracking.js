const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    seller : {
        type : String,
        required : true
    },
    buyer : {
        type : String,
        required : true
    },
    serialNumber: {
        type: String,
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
    }
},{
  versionKey: false
});

const Tracking = mongoose.model('Tracking', TrackingSchema);

module.exports = Tracking;