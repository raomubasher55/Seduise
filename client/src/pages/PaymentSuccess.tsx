import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccess = () => {
  const [, navigate] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, refreshUser } = useAuth();
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the session ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          setIsVerifying(false);
          return;
        }
        
        // Call the API to verify payment
        const response = await fetch(`/api/payment/success?session_id=${sessionId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setIsSuccess(true);
          // Refresh user to get updated premium status
          if (refreshUser) {
            await refreshUser();
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setIsVerifying(false);
      }
    };
    
    // Short timeout to simulate the payment verification process
    const timeout = setTimeout(() => {
      verifyPayment();
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [refreshUser]);
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        {isVerifying ? (
          <div className="space-y-4">
            <div className="animate-pulse flex space-x-4 justify-center">
              <div className="rounded-full bg-gray-700 h-12 w-12"></div>
            </div>
            <h1 className="text-2xl font-bold">Verifying your payment...</h1>
            <p className="text-gray-400">Please wait while we confirm your payment</p>
          </div>
        ) : isSuccess ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold">Thank You!</h1>
            <p className="text-xl text-gray-300">
              Your payment was successful, and your account has been upgraded to Premium!
            </p>
            <div className="bg-gradient-to-r from-[#402648] to-[#8B1E3F] p-6 rounded-lg mt-6">
              <h2 className="text-xl font-semibold mb-2">Premium Benefits Activated:</h2>
              <ul className="text-left space-y-2 mb-4">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-amber-400 mr-2" /> Unlimited story creations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-amber-400 mr-2" /> Premium voice options
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-amber-400 mr-2" /> Priority story processing
                </li>
              </ul>
            </div>
            <Button 
              onClick={() => navigate('/create')} 
              className="mt-6 px-6 py-6 text-lg bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black"
            >
              Create Your Next Story <ChevronRight className="ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Payment Verification Failed</h1>
            <p className="text-gray-400">
              We couldn't verify your payment. If you believe this is an error, please contact support.
            </p>
            <div className="flex space-x-4 justify-center mt-6">
              <Button onClick={() => navigate('/premium')} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate('/')} variant="default">
                Go Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;