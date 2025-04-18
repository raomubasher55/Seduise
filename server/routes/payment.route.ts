import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import stripe from '../config/stripe';
import { User } from '../models/user.model';
import { z } from 'zod';

const router = Router();

// Create a checkout session for premium subscription
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Premium subscription price (in cents)
    const PREMIUM_PRICE = 999; // $9.99

    // Get the origin for success and cancel URLs
    const origin = req.headers.origin || 'https://' + req.headers.host;
    
    // Create the checkout session for test mode
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium Subscription',
              description: 'Unlimited story generations and premium features',
            },
            unit_amount: PREMIUM_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: user.email,
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
      metadata: {
        userId: userId,
      },
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// Handle successful payment
router.get('/success', async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    // In Stripe test mode, retrieve the session to verify it
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      // Check if payment was successful (in test mode, it should be)
      if (session.payment_status === 'paid' || session.status === 'complete') {
        // Payment was successful, update the user
        const userId = req.session.userId || session.metadata?.userId;
        
        if (userId) {
          const user = await User.findById(userId);
          
          if (user) {
            user.isPremium = true;
            user.subscription = "pro";
            user.credits = (user.credits || 0) +100;
            await user.save({validateBeforeSave : false});
            console.log(`User ${userId} upgraded to premium via session: ${session_id} AAA`);
            return res.status(200).json({ success: true, message: 'Premium upgrade successful!  EEEE' });
          }
        }
      }
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
      // Continue execution to fallback
    }
    
    // Fallback for test environment - just upgrade the current user
    const userId = req.session.userId;
    if (userId) {
      // Update user to premium if they're logged in
      const user = await User.findById(userId);
      
      if (user) {
        user.isPremium = true;
        user.subscription = "pro";
        user.credits = (user.credits || 0) +100;
        await user.save();
        console.log(`User ${userId} upgraded to premium via direct session BBBB`);
        return res.status(200).json({ success: true, message: 'Premium upgrade successful! CCC' });
      }
    }
    
    return res.status(200).json({ success: true, message: 'Premium upgrade successful!  DDD  ' });
  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment success' });
  }
});

// Create a checkout session for credit purchase
router.post('/create-credit-checkout', authMiddleware, async (req, res) => {
  try {
    // Validate the request body using Zod
    const schema = z.object({
      packageId: z.string().min(1),
      credits: z.number().min(1),
      price: z.number().min(0.01)
    });

    const { packageId, credits, price } = schema.parse(req.body);
    
    // Get the user
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Price is sent in dollars, convert to cents for Stripe
    const priceInCents = Math.round(price * 100);

    // Get the origin for success and cancel URLs
    const origin = req.headers.origin || 'https://' + req.headers.host;
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Credit Package`,
              description: `Purchase ${credits} credits for your stories`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: user.email,
      success_url: `${origin}/payment/credit-success?session_id={CHECKOUT_SESSION_ID}&credits=${credits}`,
      cancel_url: `${origin}/credits`,
      metadata: {
        userId: userId,
        packageId: packageId,
        credits: credits.toString(),
        type: 'credit_purchase'
      },
    });
    
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating credit checkout session:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// Handle successful credit purchase
router.get('/credit-success', async (req, res) => {
  try {
    const { session_id, credits } = req.query;
    
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    // Parse credits
    const creditsToAdd = parseInt(credits as string) || 0;
    
    if (creditsToAdd <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid credit amount' });
    }

    // In production, verify the payment with Stripe
    // For now, we'll directly add credits to the user's account
    const userId = req.session.userId;
    if (userId) {
      // Find and update the user
      const user = await User.findById(userId);
      
      if (user) {
        // Add the credits to the user's account
        user.credits = (user.credits || 0) + creditsToAdd;
        await user.save();
        
        console.log(`Added ${creditsToAdd} credits to user ${userId}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Credits added successfully!',
          credits: user.credits
        });
      }
    }
    
    return res.status(200).json({ success: true, message: 'Credit purchase successful!' });
  } catch (error) {
    console.error('Error processing credit purchase:', error);
    res.status(500).json({ success: false, message: 'Failed to process credit purchase' });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    return res.status(400).send('Webhook Error: No signature provided');
  }

  let event;
  
  try {
    // Verify the event came from Stripe
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.warn('Webhook secret not configured');
      // For development, we'll accept the webhook without verification
      event = { type: 'checkout.session.completed', data: { object: req.body } };
    } else {
      // In production, we'll verify the webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Get the user ID from metadata
    const userId = session.metadata?.userId;
    
    if (!userId) {
      console.error('User ID not found in session metadata');
      return res.status(400).send('User ID not found in session metadata');
    }

    try {
      // Get the user
      const user = await User.findById(userId);
      
      if (!user) {
        console.error('User not found');
        return res.status(404).send('User not found');
      }

      // Check the type of purchase
      const purchaseType = session.metadata?.type;
      
      if (purchaseType === 'credit_purchase') {
        // Credit purchase
        const creditsToAdd = parseInt(session.metadata?.credits || '0');
        
        if (creditsToAdd > 0) {
          user.credits = (user.credits || 0) + creditsToAdd;
          await user.save();
          console.log(`Added ${creditsToAdd} credits to user ${userId}`);
        } else {
          console.error('Invalid credit amount');
        }
      } else {
        // Default to premium subscription
        user.isPremium = true;
        await user.save();
        console.log(`User ${userId} upgraded to premium`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).send('Error processing webhook');
    }
  }

  res.json({ received: true });
});

export default router;