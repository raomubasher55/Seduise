import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Load Stripe outside of component render cycle
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CheckoutForm = ({ onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Not Ready",
        description: "Stripe is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment/success?type=subscription',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "There was an issue with your payment. Please try again.",
          variant: "destructive",
        });
      } else {
        // The result will be handled by the redirect to return_url
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed. You will be redirected shortly.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card/50 p-4 rounded-md">
        <PaymentElement />
      </div>
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Subscribe Now'
          )}
        </Button>
      </div>
    </form>
  );
};

interface SubscriptionCheckoutProps {
  plan: 'essential' | 'passion' | 'escape';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StripeSubscriptionCheckout({ plan, onSuccess, onCancel }: SubscriptionCheckoutProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create checkout session for the selected subscription plan
    const createCheckoutSession = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/payment/create-checkout-session", { plan });
        const data = await response.json();
        
        if (data.id) {
          setClientSecret(data.id);
        } else {
          toast({
            title: "Error",
            description: data.message || "Could not initialize subscription. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to connect to payment service. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createCheckoutSession();
  }, [plan, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Preparing subscription...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Unable to initialize subscription. Please try again.</p>
        <Button onClick={onCancel} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Complete Your Subscription</h3>
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
      </div>
    </Elements>
  );
}