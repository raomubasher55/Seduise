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
  onSelectPackage?: (packageId: string) => void;
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

export default function CreditPackages({ isPremium = false, onSelectPackage }: CreditPackagesProps) {
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const getDiscountedPrice = (originalPrice: number): number => {
    if (!isPremium) return originalPrice;
    // 15% discount for premium users
    return parseFloat((originalPrice * 0.85).toFixed(2));
  };

  const handlePurchaseCredits = async (pkg: CreditPackage) => {
    setIsProcessing(prev => ({ ...prev, [pkg.id]: true }));
    
    try {
      // Make a direct request to the Stripe checkout API
      const response = await apiRequest("POST", "/api/payment/create-credit-checkout", { packageId: pkg.id });
      
      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }
      
      const { id: sessionId } = await response.json();
      
      // Redirect to Stripe checkout page
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      if (!stripe) {
        throw new Error("Stripe not loaded");
      }
      
      // Redirect to checkout
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
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
                  if (onSelectPackage) {
                    onSelectPackage(pkg.id);
                  } else {
                    handlePurchaseCredits(pkg);
                  }
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