import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coins, Star } from 'lucide-react';

interface CreditDisplayProps {
  credits: number;
  maxCredits?: number;
  isPremium?: boolean;
  onTopUp?: () => void;
}

export default function CreditDisplay({ 
  credits, 
  maxCredits = 0, 
  isPremium = false,
  onTopUp 
}: CreditDisplayProps) {
  const progress = maxCredits > 0 ? Math.min(100, (credits / maxCredits) * 100) : 0;
  
  return (
    <Card className="w-full max-w-md border-2">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Your Credits</h3>
          </div>
          {isPremium && (
            <div className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-full">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="text-xs font-medium">Premium</span>
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between mb-3">
          <div className="text-4xl font-bold">{credits}</div>
          {maxCredits > 0 && (
            <div className="text-sm text-muted-foreground">of {maxCredits} monthly credits</div>
          )}
        </div>
        
        {maxCredits > 0 && (
          <div className="mb-4">
            <Progress value={progress} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {maxCredits - credits} credits remaining this month
            </p>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-2">
          {isPremium 
            ? "As a premium member, you receive monthly credits that renew each billing cycle."
            : "Purchase credits to create stories, chapters, and audio narrations beyond your monthly limits."
          }
        </p>
      </CardContent>
    </Card>
  );
}