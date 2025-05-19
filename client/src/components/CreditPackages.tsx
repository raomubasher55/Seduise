import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CoinsIcon, TrendingUpIcon, SparklesIcon } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
  description: string;
}

interface CreditPackagesProps {
  isPremium?: boolean;
}

const packages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 20,
    price: 4.99,
    description: 'Ideal for casual users who want to create a few stories'
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 50,
    price: 9.99,
    popular: true,
    description: 'Our most popular option for regular storytellers'
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 100,
    price: 21.99,
    bestValue: true,
    description: 'Best value for dedicated story creators'
  }
];

export default function CreditPackages({ isPremium = false}: CreditPackagesProps) {
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  
  const getDiscountedPrice = (originalPrice: number): number => {
    if (!isPremium) return originalPrice;
    // 15% discount for premium users
    return parseFloat((originalPrice * 0.85).toFixed(2));
  };

  const handlePurchaseCredits = async (pkg: CreditPackage) => {
    console.log(`Starting credit purchase process for package: ${pkg.id}, credits: ${pkg.credits}, price: ${pkg.price}`);
    setIsProcessing(prev => ({ ...prev, [pkg.id]: true }));
    
    try {
      // Make a direct request to the Stripe checkout API
      console.log(`Creating checkout session via API for package: ${pkg.id}`);
      const response = await apiRequest("POST", "/api/payment/create-credit-checkout", { packageId: pkg.id });
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        throw new Error("Failed to create checkout session");
      }
      
      const responseData = await response.json();
      console.log(`Checkout session created with ID: ${responseData.id}`);
      const { id: sessionId } = responseData;
      
      // We've disabled the development shortcut to ensure Stripe integration works properly
      // This was causing payment processing to be skipped entirely
      if (false) { // Disabled DEV mode shortcut
        console.log(`Development mode detected, using direct success URL navigation`);
        window.location.href = `/payment/success?success=true&package=${pkg.id}&credits=${pkg.credits}`;
        return;
      }

          
      // Verify that Stripe public key is available
      // if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      //   console.error('Missing Stripe public key');
      //   throw new Error("Stripe public key is not configured");
      // }
      
      // In production, redirect to Stripe checkout
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
      console.error('Error in credit purchase process:', error);
      toast({
        title: "Payment Error",
        description: "There was a problem processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(prev => ({ ...prev, [pkg.id]: false }));
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {packages.map((pkg) => {
        const finalPrice = getDiscountedPrice(pkg.price);
        return (
          <Card 
            key={pkg.id} 
            className={`flex flex-col relative ${
              pkg.popular ? 'border-primary border-2 shadow-lg' : 
              pkg.bestValue ? 'border-green-500 border-2 shadow-lg' : 'border'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center">
                <Badge className="bg-primary hover:bg-primary text-white px-3 py-1">Most Popular</Badge>
              </div>
            )}
            
            {pkg.bestValue && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center">
                <Badge className="bg-green-500 hover:bg-green-500 text-white px-3 py-1">Best Value</Badge>
              </div>
            )}
            
            <CardHeader className={`${(pkg.popular || pkg.bestValue) ? 'pt-6' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                {pkg.id === 'starter' && <CoinsIcon className="h-5 w-5 text-yellow-500" />}
                {pkg.id === 'popular' && <TrendingUpIcon className="h-5 w-5 text-primary" />}
                {pkg.id === 'premium' && <SparklesIcon className="h-5 w-5 text-green-500" />}
                <CardTitle>{pkg.name}</CardTitle>
              </div>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{pkg.credits}</span>
                  <span className="text-muted-foreground">credits</span>
                </div>
                
                <div className="mt-2">
                  <span className="text-2xl font-bold">${finalPrice}</span>
                  {isPremium && pkg.price !== finalPrice && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      ${pkg.price}
                    </span>
                  )}
                </div>

                {isPremium && pkg.price !== finalPrice && (
                  <p className="text-green-500 text-sm mt-1">15% Premium discount applied</p>
                )}
                
                <p className="text-sm text-muted-foreground mt-2">
                  ~${(finalPrice / pkg.credits).toFixed(2)} per credit
                </p>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary rounded-full p-1 text-xs">✓</span>
                  <span>Create new stories</span>
                </li>
                {/* <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary rounded-full p-1 text-xs">✓</span>
                  <span>Generate chapters</span>
                </li> */}
                <li className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary rounded-full p-1 text-xs">✓</span>
                  <span>Create audio narrations</span>
                </li>
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full" 
                variant={pkg.popular ? "default" : pkg.bestValue ? "secondary" : "outline"}
                onClick={() => {
                    handlePurchaseCredits(pkg);
                    console.log(`Purchased package: ${pkg.name}`)              
                }}
                disabled={isProcessing[pkg.id]}
              >
                {isProcessing[pkg.id] ? "Processing..." : "Purchase Credits"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}