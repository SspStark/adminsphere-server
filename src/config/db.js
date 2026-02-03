import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI);
        logger.info(`MongoDB Connected: ${connect.connection.host}`);
    } catch (error) {
        logger.error("MongoDB connection error:");
        throw error;
    }
}

export default connectDB;