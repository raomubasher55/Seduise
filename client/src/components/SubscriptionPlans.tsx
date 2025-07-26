import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_PLANS } from '../../../server/constants/plans';

interface SubscriptionPlansProps {
  currentPlan?: string;
}

export function SubscriptionPlans({ currentPlan = 'discovery' }: SubscriptionPlansProps) {
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    if (planId.toLowerCase() === currentPlan.toLowerCase()) {
      toast({
        title: "Already subscribed",
        description: "You are already subscribed to this plan.",
        variant: "default",
      });
      return;
    }

    setIsProcessing(prev => ({ ...prev, [planId]: true }));

    try {
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
      {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
        <Card 
          key={planId} 
          className={`flex flex-col ${(plan as any).popular ? 'border-primary border-2 shadow-lg relative' : 'border'}`}
        >
          {(plan as any).popular && (
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <Badge className="bg-primary hover:bg-primary text-white px-3 py-1">Most Popular</Badge>
            </div>
          )}
          
          <CardHeader className={`${(plan as any).popular ? 'pt-6' : ''}`}>
            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-grow">
            <div className="mb-4">
              <span className="text-3xl font-bold">€{plan.price / 100}</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="space-y-1 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
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
              variant={planId.toLowerCase() === currentPlan.toLowerCase() ? "outline" : ((plan as any).popular ? "default" : "secondary")}
              disabled={isProcessing[planId] || planId.toLowerCase() === currentPlan.toLowerCase()}
              onClick={() => handleSubscribe(planId)}
            >
              {isProcessing[planId] ? 
                "Processing..." : 
                planId.toLowerCase() === currentPlan.toLowerCase() ? 
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