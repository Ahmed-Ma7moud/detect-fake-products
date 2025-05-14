const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        unique: true
    },
    history: [{
        owner: {
            type: String,
            required: true
        },
        tradeName: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        time: {
            type: Date, // Changed to Date type
            required: true,
            default: () => {
                const now = new Date();
                // Adjust for Cairo time zone (EET = UTC+2)
                now.setHours(now.getHours() + 2);
                return now;
            }
        },
    }]
});

const Tracking = mongoose.model('Tracking', TrackingSchema);

module.exports = Tracking;