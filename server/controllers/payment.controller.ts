import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { z } from 'zod';

export class PaymentController {
  async createSubscriptionCheckout(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { planId } = req.body;
      const origin = req.headers.origin || 'https://' + req.headers.host;

      const result = await paymentService.createSubscriptionCheckout(userId, planId, origin);
      res.json(result);
    } catch (error) {
      console.error('Error creating subscription checkout session:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to create subscription checkout session' });
    }
  }

  async createCreditCheckout(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { packageId } = req.body;
      const origin = req.headers.origin || 'https://' + req.headers.host;

      const result = await paymentService.createCreditCheckout(userId, packageId, origin);
      res.json(result);
    } catch (error) {
      console.error('Error creating credit checkout session:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  }

  async creditSuccessPost(req: Request, res: Response) {
    try {
      const session_id = req.query.session_id || req.query.CHECKOUT_SESSION_ID || (req.body && req.body.session_id);
      const credits = req.query.credits || (req.body && req.body.credits);
      const packageId = req.query.package || (req.body && req.body.package);
      
      console.log('Credit success handler received:', { 
        session_id, 
        credits, 
        packageId,
        method: req.method,
        query: req.query,
        body: req.body
      });

      const userId = req.session.userId;
      const result = await paymentService.processCreditSuccess(
        session_id as string, 
        credits as string, 
        packageId as string, 
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing credit purchase:', error);
      res.status(500).json({ success: false, message: 'Failed to process credit purchase' });
    }
  }

  async updateCredits(req: Request, res: Response) {
    try {
      const { credits } = req.body;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      
      const result = await paymentService.updateUserCredits(userId, parseInt(credits));
      console.log(`Added ${credits} credits to user ${userId} via direct update`);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating credits:', error);
      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Failed to update credits' });
    }
  }

  async subscriptionSuccessGet(req: Request, res: Response) {
    try {
      const session_id = req.query.session_id || req.query.CHECKOUT_SESSION_ID;
      const plan = req.query.plan;
      
      console.log('GET Subscription success handler received:', { 
        session_id, 
        plan,
        query: req.query
      });
      
      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid session ID' 
        });
      }

      const userId = req.session.userId;
      const result = await paymentService.processSubscriptionSuccessWithStripeVerification(
        session_id,
        plan as string,
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing subscription success:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Payment not completed')) {
          return res.status(402).json({
            success: false,
            message: 'Payment not completed. Please complete the payment and try again.'
          });
        }
        if (error.message.includes('User identification failed')) {
          return res.status(400).json({
            success: false,
            message: 'User identification failed. Please contact support.'
          });
        }
        if (error.message.includes('User not found')) {
          return res.status(404).json({
            success: false,
            message: 'User not found. Please contact support.'
          });
        }
      }
      
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred. Please contact support.'
      });
    }
  }

  async creditSuccessGet(req: Request, res: Response) {
    try {
      const session_id = req.query.session_id || req.query.CHECKOUT_SESSION_ID;
      const credits = req.query.credits;
      const packageId = req.query.package;
      
      console.log('GET Credit success handler received:', { 
        session_id, 
        credits, 
        packageId,
        query: req.query
      });
      
      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid session ID' 
        });
      }

      const userId = req.session.userId;
      const result = await paymentService.processCreditSuccessWithStripeVerification(
        session_id,
        credits as string,
        packageId as string,
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing credit success:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Payment not completed')) {
          return res.status(402).json({
            success: false,
            message: 'Payment not completed. Please complete the payment and try again.'
          });
        }
        if (error.message.includes('User identification failed')) {
          return res.status(400).json({
            success: false,
            message: 'User identification failed. Please contact support.'
          });
        }
        if (error.message.includes('User not found')) {
          return res.status(404).json({
            success: false,
            message: 'User not found. Please contact support.'
          });
        }
        if (error.message.includes('Error retrieving Stripe session')) {
          return res.status(500).json({
            success: false,
            message: 'Error verifying payment. Please contact support.'
          });
        }
      }
      
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred. Please contact support.'
      });
    }
  }

  async webhook(req: Request, res: Response) {
    console.log(`Webhook received [${new Date().toISOString()}]`);
    
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      console.error('Webhook Error: No stripe-signature header provided');
      return res.status(400).send('Webhook Error: No signature provided');
    }

    console.log(`Stripe signature received: ${signature.substring(0, 20)}...`);
    
    try {
      const event = await paymentService.verifyWebhookSignature(req.body, signature);
      console.log(`Webhook verified: ${event.id} [${event.type}]`);
      
      const result = await paymentService.processWebhookEvent(event);
      console.log('Webhook processing result:', result.message);
      
      res.json({ received: true });
    } catch (error: any) {
      console.error(`Webhook error:`, error);
      
      if (error.message && error.message.includes('signature verification failed')) {
        return res.status(400).send(`Webhook Error: ${error.message}`);
      }
      
      if (error instanceof Error) {
        return res.status(500).send(`Error processing webhook: ${error.message}`);
      }
      
      return res.status(500).send('Error processing webhook');
    }
  }
}

export const paymentController = new PaymentController();