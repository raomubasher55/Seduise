import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccessPage = () => {
  const [, setLocation] = useLocation();
  const [credits, setCredits] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper to get URL parameters
  const getParamFromUrl = (paramName: string): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
  };

  useEffect(() => {
    // Check if this is just a return from a successful payment
    const success = getParamFromUrl('success');
    const demo = getParamFromUrl('demo');
    const error = getParamFromUrl('error');
    const creditsParam = getParamFromUrl('credits');

    // If we already have credits from a redirect, just show the completed state
    if (success === 'true' && creditsParam) {
      setCredits(parseInt(creditsParam));
      setIsProcessing(false);
      return;
    } else if (demo === 'true') {
      setCredits(parseInt(creditsParam || '50'));
      setIsProcessing(false);
      return;
    } else if (error === 'true') {
      setErrorMessage('There was an issue verifying your payment. Your account will be updated soon.');
      setIsProcessing(false);
      return;
    }
    
    const processPayment = async () => {
      try {
        // Get the parameters from URL
        const sessionId = getParamFromUrl('session_id') || getParamFromUrl('CHECKOUT_SESSION_ID');
        const packageId = getParamFromUrl('package');
        const creditsFromUrl = getParamFromUrl('credits');
        
        console.log(`Processing payment with params:`, { sessionId, packageId, creditsFromUrl });
        
        // If we don't have any parameters, this might be a direct URL access
        if (!sessionId && !packageId && !creditsFromUrl) {
          console.log('No payment parameters found, showing demo mode');
          setCredits(50);
          setIsProcessing(false);
          return;
        }
        
        // For POST requests, we can send the data in the request body
        const payload = {
          session_id: sessionId,
          package: packageId,
          credits: creditsFromUrl
        };
        
        // Call the API to process the payment using POST method
        const response = await apiRequest('POST', '/api/payment/credit-success', payload);
        const data = await response.json();
        
        if (data.success) {
          setCredits(data.credits || null);
          console.log('Payment processed successfully:', data);
        } else {
          throw new Error(data.message || 'Failed to process payment');
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setErrorMessage('There was an issue verifying your payment. Your account will be updated soon.');
        
        toast({
          title: 'Verification Issue',
          description: 'We couldn\'t verify your payment details, but your account will be updated soon.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [toast]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="bg-[#1E1E1E] rounded-xl p-8 max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-['Playfair_Display'] font-bold mb-4">Payment Successful!</h2>
        <h3 className="text-xl mb-6">Credit Purchase</h3>
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p>Processing your payment...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-red-900/30 border border-red-600 rounded-md p-4 mb-6">
            <p className="text-sm">{errorMessage}</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <p className="text-2xl font-bold mb-2">
                {credits ? `${credits} Credits` : '50 Credits'}
              </p>
              <p className="text-gray-400">
                Your credits have been added to your account balance.
              </p>
            </div>
          </>
        )}
        
        <div className="flex justify-center space-x-4">
          <Button
            className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
            onClick={() => setLocation('/create')}
          >
            Create Story
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
          >
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;