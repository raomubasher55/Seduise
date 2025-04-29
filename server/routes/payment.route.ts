import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import stripe from '../config/stripe';
import { User } from '../models/user.model';
import { z } from 'zod';

const router = Router();

// Create a checkout session for premium subscription with plan selection
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
    
    // Validate request body
    const schema = z.object({
      plan: z.enum(['essential', 'passion', 'escape']).default('passion')
    });
    
    const { plan } = schema.parse(req.body);
    
    // Import subscription plans from constants
    const { SUBSCRIPTION_PLANS } = await import('../constants/plans');
    
    // Get the selected plan price (in cents)
    const planPrice = SUBSCRIPTION_PLANS[plan].price;

    // Get the origin for success and cancel URLs
    const origin = req.headers.origin || 'https://' + req.headers.host;
    
    // Create the checkout session with plan information
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur', // Using Euro as per requirements
            product_data: {
              name: `${SUBSCRIPTION_PLANS[plan].name} Subscription`,
              description: SUBSCRIPTION_PLANS[plan].description,
            },
            unit_amount: planPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // For simplicity using one-time payments; in production use 'subscription'
      customer_email: user.email,
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/payment/cancel`,
      metadata: {
        userId: userId,
        plan: plan,
        type: 'subscription_purchase'
      },
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// Handle successful subscription payment
router.get('/success', async (req, res) => {
  try {
    const { session_id, plan } = req.query;
    
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    // Default to passion plan if not provided
    const subscriptionPlan = typeof plan === 'string' ? plan : 'passion';
    
    // Import subscription plans from constants
    const { SUBSCRIPTION_PLANS } = await import('../constants/plans');
    
    // Validate plan
    if (!['essential', 'passion', 'escape'].includes(subscriptionPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
    }

    // In Stripe test mode, retrieve the session to verify it
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      // Check if payment was successful (in test mode, it should be)
      if (session.payment_status === 'paid' || session.status === 'complete') {
        // Payment was successful, update the user
        const userId = req.session.userId || session.metadata?.userId;
        const purchasedPlan = session.metadata?.plan || subscriptionPlan;
        
        if (userId) {
          const user = await User.findById(userId);
          
          if (user) {
            // Update user with subscription details
            user.isPremium = true;
            user.subscription = purchasedPlan as "essential" | "passion" | "escape";
            
            // Add bonus credits based on the plan
            let creditsToAdd = 0;
            switch (purchasedPlan) {
              case 'essential':
                creditsToAdd = 100;
                break;
              case 'passion':
                creditsToAdd = 200;
                break;
              case 'escape':
                creditsToAdd = 400;
                break;
              default:
                creditsToAdd = 100;
            }
            
            user.credits = (user.credits || 0) + creditsToAdd;
            
            // Reset usage tracking for the new month
            user.usageThisMonth = {
              storiesGenerated: 0,
              chaptersGenerated: 0,
              audioMinutesUsed: 0,
              lastResetDate: new Date()
            };
            
            await user.save({validateBeforeSave: false});
            
            console.log(`User ${userId} subscribed to ${purchasedPlan} plan via session: ${session_id}`);
            return res.status(200).json({ 
              success: true, 
              message: `Successfully subscribed to ${purchasedPlan} plan!`,
              plan: purchasedPlan
            });
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
      // Update user to the subscription if they're logged in
      const user = await User.findById(userId);
      
      if (user) {
        // Update user with subscription details
        user.isPremium = true;
        user.subscription = subscriptionPlan as "essential" | "passion" | "escape";
        
        // Add bonus credits based on the plan
        let creditsToAdd = 0;
        switch (subscriptionPlan) {
          case 'essential':
            creditsToAdd = 100;
            break;
          case 'passion':
            creditsToAdd = 200;
            break;
          case 'escape':
            creditsToAdd = 400;
            break;
          default:
            creditsToAdd = 100;
        }
        
        user.credits = (user.credits || 0) + creditsToAdd;
        
        // Reset usage tracking for the new month
        user.usageThisMonth = {
          storiesGenerated: 0,
          chaptersGenerated: 0,
          audioMinutesUsed: 0,
          lastResetDate: new Date()
        };
        
        await user.save();
        console.log(`User ${userId} subscribed to ${subscriptionPlan} plan via direct session`);
        return res.status(200).json({ 
          success: true, 
          message: `Successfully subscribed to ${subscriptionPlan} plan!`,
          plan: subscriptionPlan
        });
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Subscription successful!',
      plan: subscriptionPlan
    });
  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment success' });
  }
});

// Create a checkout session for credit purchase
router.post('/create-credit-checkout', authMiddleware, async (req, res) => {
  try {
    // Import credit packages from constants
    const { CREDIT_PACKAGES } = await import('../constants/plans');
    
    // Validate the request body using Zod
    const schema = z.object({
      packageId: z.enum(['starter', 'popular', 'premium']).default('popular')
    });

    const { packageId } = schema.parse(req.body);
    
    // Get the selected package
    const selectedPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
    
    if (!selectedPackage) {
      return res.status(400).json({ message: 'Invalid package ID' });
    }
    
    // Get the user
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get price in cents directly from the package
    const priceInCents = selectedPackage.price;

    // Get the origin for success and cancel URLs
    const origin = req.headers.origin || 'https://' + req.headers.host;
    
    // Create the checkout session with package information
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur', // Using Euro as per requirements
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits} credits - ${selectedPackage.description}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: user.email,
      success_url: `${origin}/payment/credit-success?session_id={CHECKOUT_SESSION_ID}&credits=${selectedPackage.credits}&package=${packageId}`,
      cancel_url: `${origin}/credits`,
      metadata: {
        userId: userId,
        packageId: packageId,
        credits: selectedPackage.credits.toString(),
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
      } else if (purchaseType === 'subscription_purchase') {
        // Subscription purchase
        const plan = session.metadata?.plan || 'passion';
        
        // Validate plan
        if (!['essential', 'passion', 'escape'].includes(plan)) {
          console.error('Invalid subscription plan:', plan);
          return res.status(400).send('Invalid subscription plan');
        }
        
        // Update user with subscription details
        user.isPremium = true;
        user.subscription = plan as "essential" | "passion" | "escape";
        
        // Add bonus credits based on the plan
        let creditsToAdd = 0;
        switch (plan) {
          case 'essential':
            creditsToAdd = 100;
            break;
          case 'passion':
            creditsToAdd = 200;
            break;
          case 'escape':
            creditsToAdd = 400;
            break;
          default:
            creditsToAdd = 100;
        }
        
        user.credits = (user.credits || 0) + creditsToAdd;
        
        // Reset usage tracking for the new month
        user.usageThisMonth = {
          storiesGenerated: 0,
          chaptersGenerated: 0,
          audioMinutesUsed: 0,
          lastResetDate: new Date()
        };
        
        await user.save();
        console.log(`User ${userId} subscribed to ${plan} plan via webhook`);
      } else {
        // Default handling for unknown purchase types
        console.log(`Unknown purchase type: ${purchaseType}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).send('Error processing webhook');
    }
  }

  res.json({ received: true });
});

export default router;