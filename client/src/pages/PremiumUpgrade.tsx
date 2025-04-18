import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { initiatePremiumUpgrade } from '@/lib/stripe';
import { useLocation } from 'wouter';

const PremiumUpgrade = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6">Please log in to upgrade</h1>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  // If user is already premium
  if (user.isPremium) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-4 rounded-lg mb-6">
            <h1 className="text-3xl font-bold text-black">You're Already Premium!</h1>
            <p className="text-black mt-2">You already have full access to all premium features.</p>
          </div>
          <Button onClick={() => navigate('/create')} className="px-8 py-6 text-lg">
            Create A Story <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // When clicking the upgrade button, the user will be redirected to Stripe's checkout page
      await initiatePremiumUpgrade(user._id);
      console.log(user)
      
      // The page will redirect to Stripe, so we don't need to do anything else here
      
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Upgrade Failed',
        description: 'There was a problem initiating the upgrade process. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Unlock unlimited story creation and premium features to enhance your storytelling experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-[#1E1E1E] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Free</CardTitle>
              <CardDescription className="text-gray-400">Your current plan</CardDescription>
              <div className="text-3xl font-bold mt-2">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Limited to 3 story generations</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Basic voice options</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Standard story customization</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#402648] to-[#8B1E3F] border-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400 text-black px-3 py-1 rounded-bl-lg font-semibold text-sm">
              RECOMMENDED
            </div>
            <CardHeader>
              <CardTitle className="flex items-center">
                Premium
                <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
              </CardTitle>
              <CardDescription className="text-gray-200">Unleash your creativity</CardDescription>
              <div className="text-3xl font-bold mt-2">$9.99</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center text-white">
                  <Check className="w-5 h-5 mr-3 text-amber-400" />
                  <span className="font-semibold">Unlimited story generations</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="w-5 h-5 mr-3 text-amber-400" />
                  <span>Premium voice options</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="w-5 h-5 mr-3 text-amber-400" />
                  <span>Priority story processing</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="w-5 h-5 mr-3 text-amber-400" />
                  <span>Advanced customization options</span>
                </li>
                <li className="flex items-center text-white">
                  <Check className="w-5 h-5 mr-3 text-amber-400" />
                  <span>Early access to new features</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full py-6 text-lg font-semibold bg-amber-400 hover:bg-amber-500 text-black"
                onClick={handleUpgrade}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Upgrade Now'}
                {!isLoading && <ChevronRight className="ml-2 h-5 w-5" />}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>
            Payments are processed securely through Stripe. <br />
            By upgrading, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgrade;