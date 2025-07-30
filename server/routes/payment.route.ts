import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { paymentController } from '../controllers/payment.controller';

const router = Router();

// Create a checkout session for subscription purchase
router.post('/create-subscription-checkout', authMiddleware, paymentController.createSubscriptionCheckout.bind(paymentController));

// Create a checkout session for credit purchase
router.post('/create-credit-checkout', authMiddleware, paymentController.createCreditCheckout.bind(paymentController));

// Handle successful credit purchase (POST route)
router.post('/credit-success', paymentController.creditSuccessPost.bind(paymentController));

// Add a simple endpoint to update user credits directly
router.post('/update-credits', paymentController.updateCredits.bind(paymentController));

// Handle credit purchase success via GET route (for Stripe redirects)
router.get('/credit-success', paymentController.creditSuccessGet.bind(paymentController));

// Handle subscription purchase success via GET route (for Stripe redirects)
router.get('/subscription-success', paymentController.subscriptionSuccessGet.bind(paymentController));

// Webhook to handle Stripe events (keeping for credit purchases)
router.post('/webhook', paymentController.webhook.bind(paymentController));

export default router;