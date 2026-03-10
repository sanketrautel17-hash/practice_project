import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.warn('Continuing without MongoDB connection in mock mode.');
        return false;
    }
};

export default connectDB;
