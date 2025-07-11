import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('CRITICAL ERROR: Missing STRIPE_SECRET_KEY environment variable.');
  throw new Error('Stripe secret key is required for payment processing. Please provide a valid STRIPE_SECRET_KEY in your environment variables.');
}

// Create a new Stripe instance
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as any, // Use compatible API version
});

export default stripe;