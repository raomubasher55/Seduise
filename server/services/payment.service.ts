import stripe from '../config/stripe';
import { User } from '../models/user.model';
import { z } from 'zod';

export class PaymentService {
  async createSubscriptionCheckout(userId: string, planId: string, origin: string) {
    const { SUBSCRIPTION_PLANS } = await import('../constants/plans');
    
    // Validate the plan ID
    const schema = z.object({
      planId: z.enum(['essential', 'passion', 'escape'])
    });

    const { planId: validatedPlanId } = schema.parse({ planId });
    
    // Get the selected plan
    const selectedPlan = SUBSCRIPTION_PLANS[validatedPlanId as keyof typeof SUBSCRIPTION_PLANS];
    
    if (!selectedPlan) {
      throw new Error('Invalid plan ID');
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get price in cents directly from the plan
    const priceInCents = selectedPlan.price;
    
    // Create a client reference ID that includes the user ID for security and tracking
    const clientReferenceId = `seduise_app_${userId}_${Date.now()}`;
    
    // Create the checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: selectedPlan.name,
              description: `${selectedPlan.description} - ${selectedPlan.monthlyCredits} credits/month`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: clientReferenceId,
      success_url: `${origin}/payment/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${validatedPlanId}`,
      cancel_url: `${origin}/premium-upgrade`,
      metadata: {
        userId: userId,
        plan: validatedPlanId,
        credits: selectedPlan.monthlyCredits.toString(),
        type: 'subscription_purchase'
      },
    });
    
    return { id: session.id };
  }

  async createCreditCheckout(userId: string, packageId: string, origin: string) {
    const { CREDIT_PACKAGES } = await import('../constants/plans');
    
    // Validate the package ID
    const schema = z.object({
      packageId: z.enum(['starter', 'popular', 'premium']).default('popular')
    });

    const { packageId: validatedPackageId } = schema.parse({ packageId });
    
    // Get the selected package
    const selectedPackage = CREDIT_PACKAGES[validatedPackageId as keyof typeof CREDIT_PACKAGES];
    
    if (!selectedPackage) {
      throw new Error('Invalid package ID');
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get price in cents directly from the package
    const priceInCents = selectedPackage.price;
    
    // Create a client reference ID that includes the user ID for security and tracking
    const clientReferenceId = `seduise_app_${userId}_${Date.now()}`;
    
    // Create the checkout session with package information
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
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
      client_reference_id: clientReferenceId,
      success_url: `${origin}/payment/credit-success?session_id={CHECKOUT_SESSION_ID}&credits=${selectedPackage.credits}&package=${validatedPackageId}`,
      cancel_url: `${origin}/credits`,
      metadata: {
        userId: userId,
        packageId: validatedPackageId,
        credits: selectedPackage.credits.toString(),
        type: 'credit_purchase'
      },
    });
    
    return { id: session.id };
  }

  async processCreditSuccess(sessionId?: string, credits?: string, packageId?: string, userId?: string) {
    // Handle case where no session_id is provided
    if (!sessionId) {
      if (userId) {
        // Continue with authenticated flow
      } else {
        // For testing/demo purposes
        return { 
          success: true, 
          message: 'Credit purchase completed (demo mode)', 
          demo: true 
        };
      }
    }
    
    // Either use the credits from the query or fallback to package-based lookup
    let creditsToAdd = parseInt(credits as string) || 0;
    
    // If credits amount is 0 or invalid, try to get from package ID
    if (creditsToAdd <= 0 && packageId) {
      const { CREDIT_PACKAGES } = await import('../constants/plans');
      const packageKey = packageId as keyof typeof CREDIT_PACKAGES;
      
      if (CREDIT_PACKAGES[packageKey]) {
        creditsToAdd = CREDIT_PACKAGES[packageKey].credits;
      }
    }
    
    // Fallback for testing
    if (creditsToAdd <= 0) {
      creditsToAdd = 50;
    }

    // Add credits to user's account
    if (userId) {
      const user = await User.findById(userId);
      
      if (user) {
        user.credits = (user.credits || 0) + creditsToAdd;
        await user.save();
        
        return { 
          success: true, 
          message: 'Credits added successfully!',
          credits: user.credits
        };
      }
    }
    
    return { success: true, message: 'Credit purchase successful!' };
  }

  async updateUserCredits(userId: string, credits: number) {
    if (!credits || isNaN(credits)) {
      throw new Error('Invalid credit amount');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.credits = (user.credits || 0) + credits;
    await user.save();
    
    return { 
      success: true, 
      message: 'Credits updated successfully',
      credits: user.credits
    };
  }

  async processSubscriptionSuccessWithStripeVerification(sessionId: string, plan?: string, userId?: string) {
    // Retrieve the session from Stripe to verify it's legitimate
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Check if payment was successful
    const isPaymentSuccessful = 
      session.payment_status === 'paid' || 
      (session.status === 'complete' && session.payment_status !== 'unpaid');
    
    if (!isPaymentSuccessful) {
      throw new Error(`Payment not completed: status=${session.status}, payment_status=${session.payment_status}`);
    }
    
    // Get user ID either from session metadata or from current session
    let actualUserId = session.metadata?.userId || userId;
    
    // If we don't have a user ID yet, try to extract it from client_reference_id
    if (!actualUserId && session.client_reference_id) {
      const refParts = session.client_reference_id.split('_');
      if (refParts.length >= 3 && refParts[0] === 'seduise' && refParts[1] === 'app') {
        actualUserId = refParts[2];
      }
    }
    
    if (!actualUserId) {
      throw new Error('User identification failed');
    }
    
    // Get plan from metadata or URL parameter
    let actualPlan = session.metadata?.plan || plan;
    
    if (!actualPlan || !['essential', 'passion', 'escape'].includes(actualPlan)) {
      throw new Error('Invalid subscription plan');
    }
    
    // Find and update the user
    const user = await User.findById(actualUserId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get subscription plan details
    const { SUBSCRIPTION_PLANS } = await import('../constants/plans');
    const planDetails = SUBSCRIPTION_PLANS[actualPlan as keyof typeof SUBSCRIPTION_PLANS];
    
    if (!planDetails) {
      throw new Error('Plan details not found');
    }
    
    // Update user with subscription details
    user.isPremium = true;
    user.subscription = actualPlan;
    
    // Add monthly credits based on the plan
    const creditsToAdd = planDetails.monthlyCredits;
    const previousCredits = user.credits || 0;
    user.credits = previousCredits + creditsToAdd;
    
    // Reset usage tracking for the new month
    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 0,
      audioMinutesUsed: 0,
      lastResetDate: new Date()
    };
    
    await user.save();
    
    return {
      success: true,
      message: 'Subscription activated successfully',
      plan: actualPlan,
      credits: creditsToAdd,
      totalCredits: user.credits
    };
  }

  async processCreditSuccessWithStripeVerification(sessionId: string, credits?: string, packageId?: string, userId?: string) {
    // Retrieve the session from Stripe to verify it's legitimate
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Check if payment was successful
    const isPaymentSuccessful = 
      session.payment_status === 'paid' || 
      (session.status === 'complete' && session.payment_status !== 'unpaid');
    
    if (!isPaymentSuccessful) {
      throw new Error(`Payment not completed: status=${session.status}, payment_status=${session.payment_status}`);
    }
    
    // Get user ID either from session metadata or from current session
    let actualUserId = session.metadata?.userId || userId;
    
    // If we don't have a user ID yet, try to extract it from client_reference_id
    if (!actualUserId && session.client_reference_id) {
      const refParts = session.client_reference_id.split('_');
      if (refParts.length >= 2 && refParts[0] === 'user') {
        actualUserId = refParts[1];
      }
    }
    
    if (!actualUserId) {
      throw new Error('User identification failed');
    }
    
    // Get amount of credits from metadata, request params, or package ID
    let creditsToAdd = 0;
    
    // First try to get from session metadata (most reliable)
    if (session.metadata?.credits) {
      creditsToAdd = parseInt(session.metadata.credits);
    } 
    // Then try from request parameters
    else if (credits) {
      creditsToAdd = parseInt(credits as string);
    }
    // Finally, try to derive from package ID
    else if (packageId || session.metadata?.packageId) {
      const pkgId = (packageId || session.metadata?.packageId) as string;
      const { CREDIT_PACKAGES } = await import('../constants/plans');
      const packageKey = pkgId as keyof typeof CREDIT_PACKAGES;
      
      if (CREDIT_PACKAGES[packageKey]) {
        creditsToAdd = CREDIT_PACKAGES[packageKey].credits;
      }
    }
    
    // If we still don't have any credits to add, use a minimum value
    if (creditsToAdd <= 0) {
      creditsToAdd = 20; // Minimum credit package size
    }
    
    // Find and update the user
    const user = await User.findById(actualUserId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Add credits to the user's account
    const previousCredits = user.credits || 0;
    user.credits = previousCredits + creditsToAdd;
    await user.save();
    
    return {
      success: true,
      message: 'Payment successful and credits added',
      credits: creditsToAdd,
      totalCredits: user.credits
    };
  }

  async processWebhookEvent(event: any) {
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Validate payment status
      const isPaymentSuccessful = 
        session.payment_status === 'paid' || 
        (session.status === 'complete' && session.payment_status !== 'unpaid');
      
      if (!isPaymentSuccessful) {
        throw new Error(`Payment not completed: status=${session.status}, payment_status=${session.payment_status}`);
      }
      
      // Get the user ID from metadata
      let userId = session.metadata?.userId;
      
      // If not in metadata, try to extract from client_reference_id
      if (!userId && session.client_reference_id) {
        const refParts = session.client_reference_id.split('_');
        if (refParts.length >= 2 && refParts[0] === 'user') {
          userId = refParts[1];
        }
      }
      
      if (!userId) {
        throw new Error('User ID not found in session metadata or client reference');
      }

      // Get the user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Check the type of purchase
      const purchaseType = session.metadata?.type;
      
      if (purchaseType === 'credit_purchase') {
        // Credit purchase
        const creditsToAdd = parseInt(session.metadata?.credits || '0');
        
        if (creditsToAdd > 0) {
          user.credits = (user.credits || 0) + creditsToAdd;
          await user.save();
          return { message: `Added ${creditsToAdd} credits to user ${userId}` };
        } else {
          throw new Error('Invalid credit amount');
        }
      } else if (purchaseType === 'subscription_purchase') {
        // Subscription purchases are now handled via success page, not webhook
        return { message: `Subscription purchase detected - will be processed via success page` };
      } else {
        return { message: `Unknown purchase type: ${purchaseType}` };
      }
    }

    return { message: 'Event processed successfully' };
  }

  async verifyWebhookSignature(body: any, signature: string): Promise<any> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      // For development, we'll accept the webhook without verification
      return { 
        type: 'checkout.session.completed', 
        data: { object: body },
        id: 'dev_' + Date.now()
      };
    } else {
      // In production, we'll verify the webhook signature
      return stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    }
  }
}

export const paymentService = new PaymentService();