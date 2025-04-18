import React, { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import CreditPackages from '@/components/CreditPackages';
import CreditDisplay from '@/components/CreditDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { redirectToCheckout } from '@/lib/stripe';

const CreditTopUp = () => {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    
    try {
      const packageDetails = getPackageDetails();
      if (!packageDetails) {
        throw new Error("Package details not found");
      }

      // Create a checkout session through the Stripe API
      const response = await fetch('/api/payment/create-credit-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          credits: packageDetails.credits,
          price: packageDetails.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { id: sessionId } = await response.json();
      
      redirectToCheckout(sessionId);
    
      // Load Stripe.js
      // const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      
      // if (!stripe) {
      //   throw new Error("Failed to load Stripe");
      // }

      // // Redirect to Stripe Checkout
      // const { error } = await stripe.redirectToCheckout({
      //   sessionId,
      // });

    
      
    } catch (error) {
      console.error("Error during checkout:", error);
      toast({
        title: "Failed to process payment",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const getPackageDetails = () => {
    const packages = {
      'starter': { name: 'Starter Pack', credits: 10, price: isPremium ? 2.99 : 3.99 },
      'popular': { name: 'Popular Pack', credits: 30, price: isPremium ? 6.99 : 9.99 },
      'premium': { name: 'Premium Pack', credits: 100, price: isPremium ? 14.99 : 19.99 }
    };
    
    return selectedPackage ? packages[selectedPackage as keyof typeof packages] : null;
  };

  const packageDetails = getPackageDetails();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Dashboard
      </Button>
      
      {!completed ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <CreditPackages 
                isPremium={isPremium}
                onSelectPackage={handleSelectPackage}
              />
            </div>
            <div>
              <CreditDisplay 
                credits={user?.credits || 0} 
                isPremium={isPremium}
              />
              
              {selectedPackage && packageDetails && (
                <Card className="mt-6 p-4 bg-[#1E1E1E] border border-gray-800">
                  <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Package:</span>
                      <span>{packageDetails.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credits:</span>
                      <span className="text-amber-400">{packageDetails.credits}</span>
                    </div>
                    <Separator className="my-2 bg-gray-700" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${packageDetails.price}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handlePurchase}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Complete Purchase'}
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <CheckCircle2 size={64} className="mx-auto mb-6 text-emerald-500" />
          <h2 className="text-2xl font-semibold mb-2">Purchase Complete!</h2>
          <p className="text-gray-400 mb-6">Your credits have been added to your account.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      )}
    </div>
  );
};

export default CreditTopUp;