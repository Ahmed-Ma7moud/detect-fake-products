const mongoose = require("mongoose")

async function connectDB() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB Connected...');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1); // Exit process with failure
    }
}
module.exports = connectDB