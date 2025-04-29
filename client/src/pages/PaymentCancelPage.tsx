import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

const PaymentCancelPage = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="container max-w-lg mx-auto my-16 px-4">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        
        <CardContent>
          <p className="mb-4">
            Your payment has been cancelled and you have not been charged.
          </p>
          <p className="text-muted-foreground">
            If you experienced any issues during checkout, please try again or contact our support team for assistance.
          </p>
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
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;