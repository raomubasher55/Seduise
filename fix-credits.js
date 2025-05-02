// fix-credits.js - Script to fix credit discrepancy
import mongoose from 'mongoose';

async function fixCredits() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://0.0.0.0:27017/seduise');
    console.log('Connected to the database');

    // Get the User model
    const UserSchema = new mongoose.Schema({
      email: String,
      password: String,
      name: String,
      credits: Number,
      // Other fields not needed for this simple fix
    });
    
    const User = mongoose.model('User', UserSchema);

    // Find the user and check their credits
    // Using your user ID from the logs
    const userId = '68152d9640a8e79d78c20f63';
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Found user: ${user.name}`);
    console.log(`Current credits: ${user.credits}`);
    
    // Update to 5 credits to allow for medium-length story
    await User.findByIdAndUpdate(userId, { credits: 5 });
    console.log('Updated credits to 5');
    
    // Verify the update
    const updatedUser = await User.findById(userId);
    console.log(`New credit balance: ${updatedUser.credits}`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
fixCredits();