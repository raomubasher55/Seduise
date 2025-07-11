import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
// Define packages and plans here since we can't import from server
const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    credits: 20,
    price: 499, // in cents for Stripe
    description: 'Ideal for casual users'
  },
  popular: {
    id: 'popular',
    name: 'Popular',
    credits: 50,
    price: 999, // in cents for Stripe
    popular: true,
    description: 'Our most popular option'
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    credits: 100,
    price: 2199, // in cents for Stripe
    bestValue: true,
    description: 'Best value for serious users'
  }
};

const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Basic access'
  },
  essential: {
    id: 'essential',
    name: 'Essential',
    price: 499, // in cents for Stripe
    description: 'Enhanced experience'
  },
  passion: {
    id: 'passion',
    name: 'Passion',
    price: 999, // in cents for Stripe
    popular: true,
    description: 'Premium features'
  },
  escape: {
    id: 'escape',
    name: 'Escape',
    price: 1999, // in cents for Stripe
    description: 'Ultimate experience'
  }
};
import StripeCreditCheckout from '@/components/StripeCreditCheckout';
import StripeSubscriptionCheckout from '@/components/StripeSubscriptionCheckout';

const CheckoutPage = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ type: string; id: string }>('/checkout/:type/:id');
  const { toast } = useToast();
  const [checkoutType, setCheckoutType] = useState<'credit' | 'subscription' | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (match && params) {
      const { type, id } = params;
      
      if (type === 'credit' || type === 'subscription') {
        setCheckoutType(type as 'credit' | 'subscription');
        setItemId(id);
        
        if (type === 'credit') {
          // Get credit package details
          const packageDetails = CREDIT_PACKAGES[id as keyof typeof CREDIT_PACKAGES];
          if (packageDetails) {
            setItemDetails(packageDetails);
          } else {
            toast({
              title: "Invalid package",
              description: "The selected credit package doesn't exist.",
              variant: "destructive",
            });
            setLocation('/credits');
          }
        } else if (type === 'subscription') {
          // Get subscription plan details
          const planDetails = SUBSCRIPTION_PLANS[id as keyof typeof SUBSCRIPTION_PLANS];
          if (planDetails) {
            setItemDetails(planDetails);
          } else {
            toast({
              title: "Invalid plan",
              description: "The selected subscription plan doesn't exist.",
              variant: "destructive",
            });
            setLocation('/subscription');
          }
        }
      } else {
        // Invalid checkout type
        toast({
          title: "Invalid checkout",
          description: "The checkout URL is invalid.",
          variant: "destructive",
        });
        setLocation('/');
      }
      
      setIsLoading(false);
    } else {
      // No match
      toast({
        title: "Missing information",
        description: "Required checkout information is missing.",
        variant: "destructive",
      });
      setLocation('/');
    }
  }, [match, params, toast, setLocation]);

  const handleGoBack = () => {
    if (checkoutType === 'credit') {
      setLocation('/credits');
    } else {
      setLocation('/subscription');
    }
  };

  const handleSuccess = () => {
    toast({
      title: "Purchase successful",
      description: checkoutType === 'credit' 
        ? "Your credits have been added to your account." 
        : "Your subscription has been activated.",
      variant: "default",
    });
    
    // Redirect based on checkout type
    if (checkoutType === 'credit') {
      setLocation('/credits?success=true');
    } else {
      setLocation('/subscription?success=true');
    }
  };

  const handleCancel = () => {
    handleGoBack();
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto my-12 px-4 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading checkout information...</p>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="container max-w-3xl mx-auto my-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Checkout Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">There was a problem loading the checkout information.</p>
            <Button onClick={handleGoBack}>Return</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto my-12 px-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="pl-0 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {checkoutType === 'credit' ? 'Credits' : 'Subscription'}</span>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {checkoutType === 'credit' 
              ? `Purchase ${itemDetails.name} Credit Package` 
              : `Subscribe to ${itemDetails.name} Plan`}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Product:</span>
              <span className="font-medium">
                {checkoutType === 'credit' 
                  ? `${itemDetails.name} (${itemDetails.credits} Credits)` 
                  : `${itemDetails.name} Plan (Monthly)`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-bold text-lg">€{(itemDetails.price / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <Separator className="mb-6" />
          
          {checkoutType === 'credit' && itemId && (
            <StripeCreditCheckout 
              packageId={itemId} 
              onSuccess={handleSuccess} 
              onCancel={handleCancel} 
            />
          )}
          
          {checkoutType === 'subscription' && itemId && (
            <StripeSubscriptionCheckout 
              plan={itemId as 'essential' | 'passion' | 'escape'} 
              onSuccess={handleSuccess} 
              onCancel={handleCancel} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutPage;