import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const PaymentCancelPage = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="bg-[#1E1E1E] rounded-xl p-8 max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-['Playfair_Display'] font-bold mb-4">Payment Cancelled</h2>
        
        <div className="text-center mb-8">
          <p className="text-gray-400 mb-4">
            Your payment process was cancelled and you haven't been charged.
          </p>
          <p className="text-gray-400">
            You can try again whenever you're ready.
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button
            className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
            onClick={() => setLocation('/premium-upgrade')}
          >
            Manage Subscription
          </Button>
          <Button variant="outline" onClick={() => setLocation('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
