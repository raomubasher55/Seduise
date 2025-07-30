import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentSubscriptionSuccess() {
  const [location, navigate] = useLocation();
  const { user, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    plan: string;
    sessionId?: string;
  } | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const planRaw = urlParams.get('plan');
    
    // Clean the plan parameter (remove any trailing ? or other characters)
    const plan = planRaw?.replace(/[^a-zA-Z]/g, '') || null;

    if (plan) {
      setSubscriptionDetails({ plan, sessionId: sessionId || undefined });
    }

    // Process subscription and update user data
    const processSubscription = async () => {
      try {
        if (sessionId && plan) {
          // Call the backend to process the subscription
          const response = await fetch(`/api/payment/subscription-success?session_id=${sessionId}&plan=${plan}`);
          const result = await response.json();
          
          if (!result.success) {
            console.error('Subscription processing failed:', result);
          }
        }
        
        // Refresh user data to get updated status
        await refreshUser();
        setIsProcessing(false);
      } catch (error) {
        console.error('Error processing subscription:', error);
        setIsProcessing(false);
      }
    };

    processSubscription();
  }, []);

  const getPlanDetails = (planId: string) => {
    const plans = {
      essential: {
        name: 'Essential',
        description: 'Pleasure at Your Own Pace',
        monthlyCredits: 15,
        color: 'from-pink-500 to-purple-500'
      },
      passion: {
        name: 'Passion', 
        description: 'Your Pleasure Rendezvous',
        monthlyCredits: 35,
        color: 'from-purple-500 to-indigo-500'
      },
      escape: {
        name: 'Escape',
        description: 'The Ultimate Experience Without Limits',
        monthlyCredits: 70,
        color: 'from-yellow-500 to-orange-500'
      }
    };
    return plans[planId as keyof typeof plans] || plans.essential;
  };

  if (isProcessing) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  const planDetails = subscriptionDetails ? getPlanDetails(subscriptionDetails.plan) : null;

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to Premium!
        </h1>
        <p className="text-xl text-muted-foreground">
          Your subscription has been activated successfully
        </p>
      </div>

      {planDetails && (
        <Card className="mb-8 border-2 border-purple-500/20 bg-gradient-to-r from-purple-50/5 to-pink-50/5">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Badge className={`bg-gradient-to-r ${planDetails.color} text-white px-4 py-2 text-lg`}>
                {planDetails.name} Plan
              </Badge>
            </div>
            <CardTitle className="text-2xl">{planDetails.description}</CardTitle>
            <CardDescription className="text-lg">
              You now have access to {planDetails.monthlyCredits} monthly credits and premium features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3 text-center">
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Premium Gallery</h3>
                <p className="text-sm text-muted-foreground">Access exclusive premium stories</p>
              </div>
              
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Enhanced Features</h3>
                <p className="text-sm text-muted-foreground">Better voices and customization</p>
              </div>
              
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Priority Support</h3>
                <p className="text-sm text-muted-foreground">Get help when you need it most</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Explore the Premium Gallery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Create stories with premium voices</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Access exclusive content</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Premium</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Credits:</span>
              <span className="font-semibold">{user?.credits || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plan:</span>
              <span className="font-semibold capitalize">{user?.subscription || 'Premium'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => navigate('/premium-gallery')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          size="lg"
        >
          <Crown className="h-4 w-4 mr-2" />
          Explore Premium Gallery
        </Button>
        
        <Button 
          onClick={() => navigate('/create')}
          variant="outline"
          size="lg"
        >
          Create Your First Premium Story
        </Button>
        
        <Button 
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          size="lg"
        >
          Go to Dashboard
        </Button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Questions about your subscription? 
          <Button variant="link" className="p-0 ml-1 h-auto font-normal">
            Contact Support
          </Button>
        </p>
      </div>
    </div>
  );
}