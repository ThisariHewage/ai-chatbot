const mongoose = require('mongoose');

const connectDB = async (retryCount = 5) => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        if (retryCount > 0) {
            console.log(`Retrying in 5 seconds... (${retryCount} retries left)`);
            setTimeout(() => connectDB(retryCount - 1), 5000);
        } else {
            console.error('All DB connection retries failed. Exiting.');
            process.exit(1);
        }
    }
};

module.exports = connectDB;
