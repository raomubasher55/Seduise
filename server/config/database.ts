import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Try connecting to a local MongoDB instance first
    try {
      await mongoose.connect(process.env.MONGODB_URI as string); 
      console.log('MongoDB connected to local instance');
      return;
    } catch (localError) {
      console.log('Could not connect to local MongoDB, trying remote...');
    }
    
    // If local fails, try remote
    try {
      await mongoose.connect("mongodb+srv://seduisestory:Story123@cluster0.ueu7cqi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
      console.log('MongoDB connected to Atlas');
    } catch (remoteError) { 
      throw remoteError;
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
