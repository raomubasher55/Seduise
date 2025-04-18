import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the Stripe secret key from environment variables
const stripeSecretKey = "sk_test_51RBam7CIAxhZIlG2qEc9qv78cRxV2fHPyzrKmFyuqK5NzQb0p67wDshIjrEc1MpAIbcAkPUDHouRJztg1xecvrhG00PR6KaYsG";

if (!stripeSecretKey) {
  console.error('Missing Stripe secret key. Please check your environment variables.');
}

// Create a new Stripe instance
const stripe = new Stripe(stripeSecretKey || "sk_test_51RBam7CIAxhZIlG2qEc9qv78cRxV2fHPyzrKmFyuqK5NzQb0p67wDshIjrEc1MpAIbcAkPUDHouRJztg1xecvrhG00PR6KaYsG", {
  apiVersion: '2023-10-16' as any, // Use compatible API version
});

export default stripe;