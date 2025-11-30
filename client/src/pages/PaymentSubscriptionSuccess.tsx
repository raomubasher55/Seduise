import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
          } else if (result.alreadyProcessed) {
            console.log('Subscription already processed - no duplicate credits added');
          } else {
            console.log(`Subscription processed successfully - added ${result.textCredits} text + ${result.audioCredits} audio credits`);
          }
          
          // Wait a bit for database to update
          await new Promise(resolve => setTimeout(resolve, 1000));
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
      essentiel: {
        name: 'Essential',
        description: 'Pleasure at Your Own Pace',
        monthlyCredits: { text: 5, audio: 6 },
        color: 'from-pink-500 to-purple-500'
      },
      seduction: {
        name: 'Seduction', 
        description: 'Your Pleasure Rendezvous',
        monthlyCredits: { text: 12, audio: 12 },
        color: 'from-purple-500 to-indigo-500'
      },
      intimacy: {
        name: 'Intimacy',
        description: 'The Ultimate Experience Without Limits',
        monthlyCredits: { text: 25, audio: 24 },
        color: 'from-yellow-500 to-orange-500'
      }
    };
    return plans[planId as keyof typeof plans] || plans.essentiel;
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="text-[#F0E6DC]">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  const planDetails = subscriptionDetails ? getPlanDetails(subscriptionDetails.plan) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#3D315B]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] bg-clip-text text-transparent font-['Playfair_Display']">
            Welcome to Premium!
          </h1>
          <p className="text-xl text-[#F0E6DC]">
            Your subscription has been activated successfully
          </p>
        </div>

        {planDetails && (
          <Card className="mb-8 border border-gray-700 bg-gradient-to-br from-[#1E1E1E] to-[#3D315B]">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Badge className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] text-white px-4 py-2 text-lg">
                  {planDetails.name} Plan
                </Badge>
              </div>
              <CardTitle className="text-2xl text-[#F0E6DC] font-['Playfair_Display']">{planDetails.description}</CardTitle>
              <CardDescription className="text-lg text-[#F5F5F5]">
                You now have access to {planDetails.monthlyCredits.text} text + {planDetails.monthlyCredits.audio} audio credits monthly and premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#F0E6DC]">Premium Gallery</h3>
                  <p className="text-sm text-gray-400">Access exclusive premium stories</p>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#F0E6DC]">Enhanced Features</h3>
                  <p className="text-sm text-gray-400">Better voices and customization</p>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#F0E6DC]">Priority Support</h3>
                  <p className="text-sm text-gray-400">Get help when you need it most</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border border-gray-700 bg-[#121212]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F0E6DC]">
                <Crown className="h-5 w-5 text-[#D9B08C]" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D9B08C] flex-shrink-0" />
                <span className="text-sm text-[#F5F5F5]">Explore the Premium Gallery</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D9B08C] flex-shrink-0" />
                <span className="text-sm text-[#F5F5F5]">Create stories with premium voices</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#D9B08C] flex-shrink-0" />
                <span className="text-sm text-[#F5F5F5]">Access exclusive content</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-700 bg-[#121212]">
            <CardHeader>
              <CardTitle className="text-[#F0E6DC]">Your Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Status:</span>
                <Badge className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] text-white">Premium</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Text Credits:</span>
                <span className="font-semibold text-[#D9B08C]">{user?.textCredits || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Audio Credits:</span>
                <span className="font-semibold text-[#8B1E3F]">{user?.audioCredits || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Plan:</span>
                <span className="font-semibold capitalize text-[#F0E6DC]">{user?.subscription || 'Premium'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/premium-gallery')}
            className="bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] hover:from-[#8B1E3F] hover:to-[#D9B08C] text-white"
            size="lg"
          >
            <Crown className="h-4 w-4 mr-2" />
            Explore Premium Gallery
          </Button>
          
          <Button 
            onClick={() => navigate('/create')}
            className="border border-[#D9B08C] text-[#D9B08C] hover:bg-[#D9B08C] hover:text-[#1E1E1E] bg-transparent"
            size="lg"
          >
            Create Your First Premium Story
          </Button>
          
          <Button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white hover:bg-[#2D2D2D] bg-transparent"
            size="lg"
          >
            Go to Dashboard
          </Button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Questions about your subscription? 
            <Button variant="link" className="p-0 ml-1 h-auto font-normal text-[#D9B08C] hover:text-[#8B1E3F]">
              Contact Support
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}