import { User } from "./models/user.model";
import { hash } from "bcrypt";
import mongoose from "mongoose";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

async function createAdminUser() {
  try {
    const MONGODB_URI = "mongodb://localhost:27017/story";
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ role: "admin" });
    
    if (existingAdmin) {
      console.log("Admin user already exists with email:", existingAdmin.email);
      await mongoose.disconnect();
      return;
    }
    
    // Create admin user
    const adminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: await hash("admin123", 10),
      role: "admin",
      isPremium: true
    });
    
    await adminUser.save();
    
    console.log("Admin user created successfully!");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

// Execute the function
createAdminUser();