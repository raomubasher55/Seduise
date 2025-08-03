import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccessPage = () => {
  const [, setLocation] = useLocation();
  const [credits, setCredits] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, refreshUser } = useAuth(); // Add auth context

  // Helper to get URL parameters
  const getParamFromUrl = (paramName: string): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
  };

  // Refresh user data after payment
  useEffect(() => {
    if (!isProcessing && credits) {
      // Force refresh user data after a delay to allow backend updates to complete
      setTimeout(() => {
        refreshUser().then(() => {
          console.log('User data refreshed after credit purchase');
        }).catch(err => {
          console.error('Failed to refresh user data:', err);
        });
      }, 1000);  // Add small delay to ensure backend updates are complete
    }
  }, [isProcessing, credits, refreshUser]);

  useEffect(() => {
    // Check if this is just a return from a successful payment
    const success = getParamFromUrl('success');
    const demo = getParamFromUrl('demo');
    const error = getParamFromUrl('error');
    const creditsParam = getParamFromUrl('credits');

    // If we already have credits from a redirect, just show the completed state
    if (success === 'true' && creditsParam) {
      const parsedCredits = parseInt(creditsParam);
      setCredits(parsedCredits);
      setIsProcessing(false);
      
      // If user is authenticated, update their credits on the server
      if (user && parsedCredits > 0) {
        // Store flag in localStorage to prevent duplicate updates
        if (!localStorage.getItem('credit_update_' + parsedCredits)) {
          localStorage.setItem('credit_update_' + parsedCredits, 'true');
          
          apiRequest('POST', '/api/payment/update-credits', { credits: parsedCredits })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                console.log('Credits updated via success param:', data);
                refreshUser(); // Refresh user data to show updated credits
                
                // Clear flag after a while
                setTimeout(() => {
                  localStorage.removeItem('credit_update_' + parsedCredits);
                }, 30000); // Remove after 30 seconds
              }
            })
            .catch(err => console.error('Failed to update credits:', err));
        } else {
          console.log('Credits already updated, skipping duplicate update');
          refreshUser(); // Still refresh to show current balance
        }
      }
      
      return;
    } else if (demo === 'true') {
      const demoCredits = parseInt(creditsParam || '50');
      setCredits(demoCredits);
      setIsProcessing(false);
      
      // If user is authenticated in demo mode, still update their credits
      if (user && demoCredits > 0) {
        // Store flag in localStorage to prevent duplicate updates
        if (!localStorage.getItem('credit_update_demo_' + demoCredits)) {
          localStorage.setItem('credit_update_demo_' + demoCredits, 'true');
          
          apiRequest('POST', '/api/payment/update-credits', { credits: demoCredits })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                console.log('Credits updated via demo mode:', data);
                refreshUser(); // Refresh user data to show updated credits
                
                // Clear flag after a while
                setTimeout(() => {
                  localStorage.removeItem('credit_update_demo_' + demoCredits);
                }, 30000); // Remove after 30 seconds
              }
            })
            .catch(err => console.error('Failed to update demo credits:', err));
        } else {
          console.log('Demo credits already updated, skipping duplicate update');
          refreshUser(); // Still refresh to show current balance
        }
      }
      
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
        
        // Check if this payment has already been processed
        const paymentKey = `payment_${sessionId || packageId || creditsFromUrl}`;
        
        if (!localStorage.getItem(paymentKey)) {
          localStorage.setItem(paymentKey, 'true');
          
          // Call the API to process the payment using POST method
          const response = await apiRequest('POST', '/api/payment/credit-success', payload);
          const data = await response.json();
          
          if (data.success) {
            setCredits(data.credits || null);
            console.log('Payment processed successfully:', data);
            
            // After successful payment processing, refresh user data
            if (user) {
              setTimeout(() => refreshUser(), 1000);
            }
            
            // Clear flag after a while
            setTimeout(() => {
              localStorage.removeItem(paymentKey);
            }, 30000); // Remove after 30 seconds
          } else {
            throw new Error(data.message || 'Failed to process payment');
          }
        } else {
          console.log('Payment already processed, skipping duplicate processing');
          setCredits(parseInt(creditsFromUrl as string) || 50);
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
  }, [toast, user, refreshUser]);

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
                {user ? 
                  `Your credits have been added to your account. New balance: ${user.textCredits || 0} text + ${user.audioCredits || 0} audio credits.` :
                  'Your credits have been added to your account balance.'}
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