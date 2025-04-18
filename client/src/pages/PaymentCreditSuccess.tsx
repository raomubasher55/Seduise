import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

const PaymentCreditSuccess = () => {
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  
  // Get URL params
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const credits = params.get('credits');
  
  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId) {
        setError('Invalid session ID');
        setIsProcessing(false);
        return;
      }
      
      try {
        // Call the API to process the credit purchase
        const response = await fetch(`/api/payment/credit-success?session_id=${sessionId}&credits=${credits}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to process payment');
        }
        
        // Update user data
        await refreshUser();
        
        // Update the credits added
        setCreditsAdded(parseInt(credits || '0'));
        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing payment:', err);
        setError('Failed to process payment. Please contact support.');
        setIsProcessing(false);
      }
    };
    
    processPayment();
  }, [sessionId, credits, refreshUser]);
  
  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card className="bg-[#1E1E1E] p-8 text-center">
        {isProcessing ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9B08C] mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">Processing Your Purchase</h2>
            <p className="text-gray-400">Please wait while we add credits to your account...</p>
          </div>
        ) : error ? (
          <div className="py-8">
            <div className="rounded-full h-12 w-12 bg-red-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">!</span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Something Went Wrong</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/credits')}>Try Again</Button>
          </div>
        ) : (
          <div className="py-8">
            <div className="rounded-full h-16 w-16 bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Credit Purchase Successful!</h2>
            <p className="text-gray-400 mb-2">Thank you for your purchase.</p>
            {creditsAdded && (
              <p className="text-xl font-semibold text-amber-500 mb-6">
                {creditsAdded} credits have been added to your account
              </p>
            )}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              <Button onClick={() => navigate('/create')} variant="outline">
                Create a New Story
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentCreditSuccess;