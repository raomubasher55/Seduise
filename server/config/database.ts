import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {

  
    // await mongoose.connect(process.env.MONGO_URI as string);
    await mongoose.connect("mongodb://82.25.118.148:27017/story");
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
