import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`⚠️  MongoDB connection failed: ${error.message}`);
        console.error('   Server will run without database. Auth routes requiring MongoDB will not work.');
        // Do NOT call process.exit(1) — let the server keep running
    }
};

export default connectDB;
