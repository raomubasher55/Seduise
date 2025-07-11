import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from './queryClient';

// Initialize Stripe with the publishable key from environment variables
// This key is safe to be in client-side code
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublishableKey) {
  console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
console.log('Stripe publishable key available:', !!stripePublishableKey);

/**
 * Creates a checkout session for the premium subscription
 * @param userId The ID of the user
 * @returns The ID of the created checkout session
 */
export async function createCheckoutSession(userId: string): Promise<string> {
  const response = await apiRequest('POST', '/api/payment/create-checkout-session');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create checkout session');
  }
  
  const data = await response.json();
  console.log('Checkout session created:', data);
  return data.id;
}

/**
 * Redirects the user to the Stripe checkout page
 * @param sessionId The ID of the checkout session
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  if (!stripePublishableKey) {
    throw new Error('Stripe publishable key is not available');
  }

  try {
    const stripe = await loadStripe(stripePublishableKey);
    
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Stripe redirect error:', error);
    throw new Error(error.message || 'Failed to redirect to checkout');
  }
}

/**
 * Initiates the premium upgrade process
 * @param userId The ID of the user
 * @returns The session ID for the checkout
 */
export async function initiatePremiumUpgrade(userId: string): Promise<string> {
  try {
    // Create a checkout session
    const sessionId = await createCheckoutSession(userId);
    
    // Immediately redirect to Stripe checkout
    await redirectToCheckout(sessionId);
    
    
    return sessionId;
  } catch (error) {
    console.error('Payment initiation error:', error);
    throw error;
  }
}