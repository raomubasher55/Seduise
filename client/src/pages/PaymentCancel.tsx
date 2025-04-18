import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const PaymentCancel = () => {
  const [, navigate] = useLocation();
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold">Payment Cancelled</h1>
          <p className="text-xl text-gray-300">
            Your premium upgrade was cancelled. No payment has been processed.
          </p>
          
          <div className="bg-gray-800 p-6 rounded-lg mt-6">
            <h2 className="text-xl font-semibold mb-4">What happens now?</h2>
            <p className="text-gray-300 mb-4">
              Your account will remain on the free plan with the standard limitations:
            </p>
            <ul className="text-left space-y-2 text-gray-300">
              <li>• Limited to 3 story generations</li>
              <li>• Basic voice options only</li>
              <li>• Standard story customization</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3 mt-6">
            <Button 
              onClick={() => navigate('/premium')} 
              className="px-6 py-6 text-lg bg-gradient-to-r from-[#8B1E3F] to-[#3D315B]"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="px-6 py-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;