import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('Missing Stripe secret key. Please check your environment variables.');
  console.log('Using development mode with fallback key for Stripe. This should only be used for testing.');
}

// Create a new Stripe instance
const stripe = new Stripe(stripeSecretKey || "sk_test_fallback", {
  apiVersion: '2023-10-16' as any, // Use compatible API version
});

export default stripe;