import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  popular?: boolean;
  description: string;
  features: {
    included: string[];
    excluded: string[];
  };
  limits: {
    storiesPerMonth: number;
    chaptersPerMonth: number;
    audioMinutes: number;
  };
}

interface SubscriptionPlansProps {
  currentPlan?: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Basic access to our story generation platform',
    features: {
      included: [
        'Generate up to 4 stories per month',
        'Basic voice narration',
        'Standard story customization',
      ],
      excluded: [
        'Premium voices',
        'Priority generation',
        'Advanced customization options'
      ]
    },
    limits: {
      storiesPerMonth: 4,
      chaptersPerMonth: 12,
      audioMinutes: 3
    }
  },
  {
    id: 'essential',
    name: 'Essential',
    price: 4.99,
    description: 'Enhanced story experience with more options',
    features: {
      included: [
        'Generate up to 10 stories per month',
        'Improved voice narration',
        'Enhanced story customization',
        'Priority generation queue'
      ],
      excluded: [
        'Premium voices',
        'Exclusive themes'
      ]
    },
    limits: {
      storiesPerMonth: 10,
      chaptersPerMonth: 50,
      audioMinutes: 10
    }
  },
  {
    id: 'passion',
    name: 'Passion',
    price: 9.99,
    popular: true,
    description: 'Our most popular plan with premium features',
    features: {
      included: [
        'Generate up to 20 stories per month',
        'Premium voice selection',
        'Advanced story customization',
        'Exclusive story themes',
        'Priority support'
      ],
      excluded: [
        'Unlimited audio narration'
      ]
    },
    limits: {
      storiesPerMonth: 20,
      chaptersPerMonth: 100,
      audioMinutes: 15
    }
  },
  {
    id: 'escape',
    name: 'Escape',
    price: 19.99,
    description: 'Unlimited access to all premium features',
    features: {
      included: [
        'Generate up to 40 stories per month',
        'All premium voices',
        'Complete customization options',
        'VIP support',
        'Early access to new features',
        'Exclusive content'
      ],
      excluded: []
    },
    limits: {
      storiesPerMonth: 40,
      chaptersPerMonth: 200,
      audioMinutes: 20
    }
  }
];

export function SubscriptionPlans({ currentPlan = 'free' }: SubscriptionPlansProps) {
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    // Don't do anything if it's the current plan
    if (planId === currentPlan) {
      toast({
        title: "Already subscribed",
        description: "You are already subscribed to this plan.",
        variant: "default",
      });
      return;
    }

    setIsProcessing(prev => ({ ...prev, [planId]: true }));

    try {
      // Navigate to the checkout page for subscriptions
      window.location.href = `/checkout/subscription/${planId}`;
    } catch (error) {
      console.error('Error redirecting to subscription checkout:', error);
      toast({
        title: "Navigation Error",
        description: "There was a problem redirecting to the subscription page. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(prev => ({ ...prev, [planId]: false }));
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`flex flex-col ${plan.popular ? 'border-primary border-2 shadow-lg relative' : 'border'}`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <Badge className="bg-primary hover:bg-primary text-white px-3 py-1">Most Popular</Badge>
            </div>
          )}
          
          <CardHeader className={`${plan.popular ? 'pt-6' : ''}`}>
            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-grow">
            <div className="mb-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Usage Limits</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{plan.limits.storiesPerMonth} stories per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{plan.limits.chaptersPerMonth} chapters per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Up to {plan.limits.audioMinutes} min audio per story</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="space-y-1 text-sm">
                  {plan.features.included.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.excluded.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <X className="h-4 w-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              variant={plan.id === currentPlan ? "outline" : (plan.popular ? "default" : "secondary")}
              disabled={isProcessing[plan.id] || plan.id === currentPlan}
              onClick={() => handleSubscribe(plan.id)}
            >
              {isProcessing[plan.id] ? 
                "Processing..." : 
                plan.id === currentPlan ? 
                  "Current Plan" : 
                  `Subscribe to ${plan.name}`
              }
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default SubscriptionPlans;