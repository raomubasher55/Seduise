import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Home, BookOpen } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<{
    type?: 'subscription' | 'credit';
    plan?: string;
    credits?: number;
    success: boolean;
  }>({ success: false });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const sessionId = params.get('session_id');
    const plan = params.get('plan');
    const credits = params.get('credits');
    const paymentType = params.get('type') || (plan ? 'subscription' : 'credit');

    const verifyPayment = async () => {
      try {
        setIsVerifying(true);
        
        if (!sessionId) {
          // No session ID means we should just show a generic success
          setPaymentDetails({
            type: paymentType as 'subscription' | 'credit',
            plan: plan || undefined,
            credits: credits ? parseInt(credits) : undefined,
            success: true
          });
          return;
        }
        
        // Call the appropriate success endpoint based on payment type
        const endpoint = paymentType === 'subscription' 
          ? '/api/payment/success' 
          : '/api/payment/credit-success';
        
        const response = await apiRequest('GET', `${endpoint}?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Payment verification failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setPaymentDetails({
            type: paymentType as 'subscription' | 'credit',
            plan: data.plan || plan || undefined,
            credits: data.credits || (credits ? parseInt(credits) : undefined),
            success: true
          });
          
          toast({
            title: "Payment Successful",
            description: data.message || "Your payment has been processed successfully.",
          });
        } else {
          throw new Error(data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        
        // Still show success page but with warning
        setPaymentDetails({
          type: paymentType as 'subscription' | 'credit',
          plan: plan || undefined,
          credits: credits ? parseInt(credits) : undefined,
          success: true
        });
        
        toast({
          title: "Verification Issue",
          description: "We couldn't verify your payment details, but your account will be updated soon.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [search, toast]);

  if (isVerifying) {
    return (
      <div className="container max-w-lg mx-auto my-16 px-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-xl">Verifying Your Payment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p>Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto my-16 px-4">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <Badge variant="outline" className="px-3 py-1 text-base">
              {paymentDetails.type === 'subscription' ? 'Subscription' : 'Credit Purchase'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {paymentDetails.type === 'subscription' && paymentDetails.plan && (
              <>
                <p>You have successfully subscribed to our</p>
                <p className="text-lg font-semibold">{paymentDetails.plan.charAt(0).toUpperCase() + paymentDetails.plan.slice(1)} Plan</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Enjoy your premium features and enhanced story generation!
                </p>
              </>
            )}
            
            {paymentDetails.type === 'credit' && paymentDetails.credits && (
              <>
                <p>You have successfully purchased</p>
                <p className="text-lg font-semibold">{paymentDetails.credits} Credits</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your credits have been added to your account balance.
                </p>
              </>
            )}
            
            {(!paymentDetails.plan && !paymentDetails.credits) && (
              <p>Your purchase has been processed successfully.</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center gap-3">
          <Button 
            onClick={() => setLocation('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
          
          <Button 
            onClick={() => setLocation('/stories/new')}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Create Story</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;