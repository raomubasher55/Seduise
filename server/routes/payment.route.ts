import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

// Create a checkout session for subscription purchase
router.post('/create-subscription-checkout', authMiddleware, paymentController.createSubscriptionCheckout.bind(paymentController));

// Handle subscription purchase success via GET route (for Stripe redirects)
router.get('/subscription-success', paymentController.subscriptionSuccessGet.bind(paymentController));

// Webhook to handle Stripe subscription events
router.post('/webhook', paymentController.webhook.bind(paymentController));

export default router;
