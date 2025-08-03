import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, Sparkles, Heart, Zap, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  description: string;
  monthlyCredits: number;
  popular?: boolean;
  bestValue?: boolean;
  features: string[];
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    price: 0,
    billingPeriod: 'free',
    description: 'Explore Without Commitment',
    monthlyCredits: 10,
    features: [
      '🖋 Create up to 2 personalized stories (text)',
      '🎧 1 free audio',
      '🎙 Standard voice',
      '📚 No access to the premium library',
      '✨ Perfect to explore the world of Seduice for free'
    ]
  },
  {
    id: 'essentiel',
    name: 'Essential',
    price: 5.99,
    billingPeriod: 'monthly',
    description: 'Pleasure at Your Own Pace',
    monthlyCredits: 15,
    popular: true,
    features: [
      '🖋 Create up to 5 personalized stories (text)',
      '🎧 6 audio credits',
      '🎙 Natural-sounding voices',
      '📚 No access to the premium library',
      '🔐 A soft and regular introduction to your intimate desires'
    ]
  },
  {
    id: 'seduction',
    name: 'Seduction',
    price: 11.99,
    billingPeriod: 'monthly',
    description: 'Your Pleasure Rendezvous',
    monthlyCredits: 35,
    features: [
      '🖋 Create up to 12 personalized stories (text)',
      '🎧 12 audio credits',
      '🎙 Expressive & realistic voices',
      '📚 Partial access to the premium audio library',
      '🎁 New stories added monthly',
      '💫 Let your desires unfold like an intimate audio series'
    ]
  },
  {
    id: 'intimacy',
    name: 'Intimacy',
    price: 24.99,
    billingPeriod: 'monthly',
    description: 'The Ultimate Experience Without Limits',
    monthlyCredits: 70,
    bestValue: true,
    features: [
      '🖋 Create up to 25 personalized stories (text)',
      '🎧 24 audio credits',
      '🎙 Expressive & immersive voices',
      '📚 Full access to the premium audio library',
      '💌 Tailored suggestions and exclusive stories',
      '⭐ Priority support & early feature access'
    ]
  }
];

export default function PremiumUpgrade() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan.id === 'discovery') {
      toast({
        title: "Already Active",
        description: "You're already on the free Discovery plan!",
        variant: "default",
      });
      return;
    }

    console.log(`Starting subscription process for plan: ${plan.id}, price: €${plan.price}`);
    setIsProcessing(prev => ({ ...prev, [plan.id]: true }));
    
    try {
      // Create subscription checkout session
      console.log(`Creating subscription checkout session for plan: ${plan.id}`);
      const response = await apiRequest("POST", "/api/payment/create-subscription-checkout", { 
        planId: plan.id,
        priceId: plan.id // We'll map this on the backend
      });
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        throw new Error("Failed to create subscription checkout session");
      }
      
      const responseData = await response.json();
      console.log(`Subscription checkout session created with ID: ${responseData.id}`);
      const { id: sessionId } = responseData;
      
      // Load Stripe and redirect to checkout
      const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_live_51PgOMoJgyEyHyHBaM0BbudKVysyoGGk0GfJPkADVoq1qSa2huk2IR6HbWFpRWRHURYJMx3qceMhI0m2owOZwZ5eQ00n1jAjfsh";
      if (!STRIPE_PUBLIC_KEY || typeof STRIPE_PUBLIC_KEY !== 'string') {
        console.error('Invalid or missing Stripe public key');
        throw new Error("Stripe public key is not properly configured");
      }
      
      console.log(`Loading Stripe with public key: ${STRIPE_PUBLIC_KEY.substring(0, 8)}...`);
      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
      if (!stripe) {
        console.error('Failed to initialize Stripe');
        throw new Error("Stripe not loaded");
      }
      
      // Redirect to checkout
      console.log(`Redirecting to Stripe checkout with session ID: ${sessionId}`);
      const result = await stripe.redirectToCheckout({ sessionId });
      
      if (result.error) {
        console.error('Stripe redirect error:', result.error);
        throw new Error(result.error.message || "Error redirecting to Stripe");
      }
    } catch (error) {
      console.error('Error in subscription process:', error);
      toast({
        title: "Subscription Error",
        description: "There was a problem processing your subscription. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(prev => ({ ...prev, [plan.id]: false }));
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'discovery':
        return <Sparkles className="h-5 w-5 text-blue-500" />;
      case 'essentiel':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'seduction':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'intimacy':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getCurrentPlan = () => {
    if (!user?.isPremium) return 'discovery';
    return user.subscription || 'discovery';
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#3D315B]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] bg-clip-text text-transparent font-['Playfair_Display']">
            Choose Your Premium Experience
          </h1>
          <p className="text-lg text-[#F5F5F5] max-w-2xl mx-auto">
            Unlock the full potential of Seduice with premium plans designed to enhance your intimate storytelling journey
          </p>
        </div>

        {user && (
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-[#1E1E1E] to-[#3D315B] border border-gray-700 rounded-lg p-4">
              <p className="text-center text-sm text-gray-400">
                Current Plan: <span className="font-semibold text-[#F0E6DC] capitalize">{currentPlan}</span>
                {user.isPremium && (
                  <Badge className="ml-2 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] text-white">Premium</Badge>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isUpgrade = plan.id !== 'discovery' && !user?.isPremium;
            
            return (
              <Card 
                key={plan.id}
                className={`flex flex-col relative transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] border-gray-700 ${
                  plan.popular ? 'border-[#D9B08C] border-2 shadow-lg scale-105' : 
                  plan.bestValue ? 'border-[#8B1E3F] border-2 shadow-lg' : 
                  isCurrentPlan ? 'border-[#D9B08C] border-2' : 'border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] text-white px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                
                {plan.bestValue && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] text-white px-3 py-1">Best Value</Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] text-white px-3 py-1">Current Plan</Badge>
                  </div>
                )}
                
                <CardHeader className={`${(plan.popular || plan.bestValue || isCurrentPlan) ? 'pt-6' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getPlanIcon(plan.id)}
                    <CardTitle className="text-xl text-[#F0E6DC]">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                </CardHeader>
              
                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[#F0E6DC]">
                        {plan.price === 0 ? 'Free' : `€${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-400">/{plan.billingPeriod}</span>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#D9B08C] mt-0.5 flex-shrink-0" />
                        <span className="text-[#F5F5F5]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              
                <CardFooter>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? "bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] hover:from-[#8B1E3F] hover:to-[#D9B08C] text-white" 
                        : plan.bestValue 
                        ? "bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] hover:from-[#D9B08C] hover:to-[#8B1E3F] text-white"
                        : isCurrentPlan
                        ? "bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] text-white"
                        : "border border-[#D9B08C] text-[#D9B08C] hover:bg-[#D9B08C] hover:text-[#1E1E1E] bg-transparent"
                    }`}
                    onClick={() => handleSubscribe(plan)}
                    disabled={isProcessing[plan.id] || isCurrentPlan}
                  >
                    {isProcessing[plan.id] ? "Processing..." : 
                     isCurrentPlan ? "Current Plan" :
                     plan.id === 'discovery' ? "Free Plan" :
                     isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                  </Button>
                </CardFooter>
            </Card>
          );
        })}
      </div>

        {/* Premium Benefits Section */}
        <div className="bg-gradient-to-r from-[#1E1E1E] to-[#3D315B] border border-gray-700 rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-[#F0E6DC] font-['Playfair_Display']">Why Choose Premium?</h2>
            <p className="text-gray-400">Unlock the full potential of your intimate storytelling experience</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#F0E6DC]">Exclusive Content</h3>
              <p className="text-gray-400">Access to premium story library with exclusive content not available to free users</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#F0E6DC]">Enhanced Experience</h3>
              <p className="text-gray-400">More credits, better voices, and advanced customization options for your stories</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#F0E6DC]">Priority Support</h3>
              <p className="text-gray-400">Get priority customer support and early access to new features</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-[#F0E6DC] font-['Playfair_Display']">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-[#F0E6DC]">Can I change my plan anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-[#F0E6DC]">What happens to unused credits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Unused credits roll over to the next month, so you never lose them. They only expire if you cancel your subscription.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-[#F0E6DC]">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-[#F0E6DC]">Is my payment secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Absolutely. We use Stripe for secure payment processing. We never store your payment information on our servers.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}