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
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">Upgrade Your Plan</h1>
        <p className="text-lg text-gray-400 mb-8">
          Explore our subscription plans to unlock more features and credits.
        </p>
        <Button onClick={() => navigate('/subscription')}>View Plans</Button>
      </div>
    </div>
  );
};

export default PremiumUpgrade;