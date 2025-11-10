import stripe from "../config/stripe";
import { User } from "../models/user.model";
import { z } from "zod";
import { SUBSCRIPTION_PLANS } from "../constants/plans";

export class PaymentService {
  async createSubscriptionCheckout(userId: string, planId: string, origin: string) {
    const schema = z.object({
      planId: z.enum(["essentiel", "seduction", "intimacy"]),
    });

    const { planId: validatedPlanId } = schema.parse({ planId });
    const selectedPlan = SUBSCRIPTION_PLANS[validatedPlanId as keyof typeof SUBSCRIPTION_PLANS];

    if (!selectedPlan) {
      throw new Error("Invalid plan ID");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const clientReferenceId = `seduise_app_${userId}_${Date.now()}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: selectedPlan.name,
              description: `${selectedPlan.description} - ${selectedPlan.monthlyCredits.text} text + ${selectedPlan.monthlyCredits.audio} audio credits/month`,
            },
            unit_amount: selectedPlan.price,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: clientReferenceId,
      success_url: `${origin}/payment/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${validatedPlanId}`,
      cancel_url: `${origin}/premium-upgrade`,
      metadata: {
        userId,
        plan: validatedPlanId,
        textCredits: selectedPlan.monthlyCredits.text.toString(),
        audioCredits: selectedPlan.monthlyCredits.audio.toString(),
        type: "subscription_purchase",
      },
    });

    return { id: session.id };
  }

  async processSubscriptionSuccessWithStripeVerification(sessionId: string, plan?: string, userId?: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const isPaymentSuccessful =
      session.payment_status === "paid" ||
      (session.status === "complete" && session.payment_status !== "unpaid");

    if (!isPaymentSuccessful) {
      throw new Error(`Payment not completed: status=${session.status}, payment_status=${session.payment_status}`);
    }

    let actualUserId = session.metadata?.userId || userId;

    if (!actualUserId && session.client_reference_id) {
      const refParts = session.client_reference_id.split("_");
      if (refParts.length >= 3 && refParts[0] === "seduise" && refParts[1] === "app") {
        actualUserId = refParts[2];
      }
    }

    if (!actualUserId) {
      throw new Error("User identification failed");
    }

    let actualPlan = session.metadata?.plan || plan;

    if (!actualPlan || !["essentiel", "seduction", "intimacy"].includes(actualPlan)) {
      throw new Error("Invalid subscription plan");
    }

    const user = await User.findById(actualUserId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.processedSessions && user.processedSessions.includes(sessionId)) {
      return {
        success: true,
        message: "Subscription already processed",
        plan: actualPlan,
        alreadyProcessed: true,
        textCredits: 0,
        audioCredits: 0,
        totalTextCredits: user.textCredits || 0,
        totalAudioCredits: user.audioCredits || 0,
      };
    }

    const planDetails = SUBSCRIPTION_PLANS[actualPlan as keyof typeof SUBSCRIPTION_PLANS];
    if (!planDetails) {
      throw new Error("Plan details not found");
    }

    user.isPremium = true;
    user.subscription = actualPlan;

    if (!user.processedSessions) {
      user.processedSessions = [];
    }
    user.processedSessions.push(sessionId);

    const creditsToAdd = planDetails.monthlyCredits;
    user.textCredits = (user.textCredits || 0) + creditsToAdd.text;
    user.audioCredits = (user.audioCredits || 0) + creditsToAdd.audio;

    user.usageThisMonth = {
      storiesGenerated: 0,
      chaptersGenerated: 0,
      textCreditsUsed: 0,
      audioCreditsUsed: 0,
      lastResetDate: new Date(),
    };

    await user.save();

    return {
      success: true,
      message: "Subscription activated successfully",
      plan: actualPlan,
      textCredits: creditsToAdd.text,
      audioCredits: creditsToAdd.audio,
      totalTextCredits: user.textCredits,
      totalAudioCredits: user.audioCredits,
    };
  }

  async processWebhookEvent(event: any) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const purchaseType = session.metadata?.type;

      if (purchaseType === "subscription_purchase") {
        return { message: "Subscription purchase handled via success page" };
      }

      return { message: `Unhandled purchase type: ${purchaseType || "unknown"}` };
    }

    return { message: "Event processed successfully" };
  }

  async verifyWebhookSignature(body: any, signature: string): Promise<any> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      return {
        type: "checkout.session.completed",
        data: { object: body },
        id: `dev_${Date.now()}`,
      };
    }

    return stripe.webhooks.constructEvent(body, signature, endpointSecret);
  }
}

export const paymentService = new PaymentService();
