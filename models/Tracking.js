const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true
    },
    medicineName : {
        type : String,
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
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

TrackingSchema.index({serialNumber : 1})
const Tracking = mongoose.model('Tracking', TrackingSchema);

module.exports = Tracking;