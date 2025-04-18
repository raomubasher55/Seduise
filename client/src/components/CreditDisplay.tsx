import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

interface CreditDisplayProps {
  credits: number;
  maxCredits?: number;
  isPremium?: boolean;
  onTopUp?: () => void;
}

const CreditDisplay = ({ 
  credits, 
  maxCredits = 20, 
  isPremium = false,
  onTopUp
}: CreditDisplayProps) => {
  return (
    <div className="p-4 bg-[#1E1E1E] border border-gray-800 rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-amber-400" />
          <h3 className="text-lg font-medium">Story Credits</h3>
        </div>
        <div className="text-amber-400 font-semibold">
          {credits} / {isPremium ? '∞' : maxCredits}
        </div>
      </div>
      
      <Slider
        value={[credits]}
        max={maxCredits}
        step={1}
        disabled
        className="mb-4"
      />
      
      <div className="text-sm text-gray-400 mb-3">
        {credits === 0 ? (
          <span className="text-red-400">You're out of credits! Top up to create more stories.</span>
        ) : credits < 3 ? (
          <span className="text-amber-400">You're running low on credits.</span>
        ) : (
          <span>Use credits to create new stories or continue existing ones.</span>
        )}
        {isPremium && (
          <span className="ml-1 text-emerald-400">Premium users get discounted credit rates!</span>
        )}
      </div>
      
      <Button 
        onClick={onTopUp} 
        variant="outline" 
        className="w-full border-amber-500 hover:bg-amber-500/20 text-amber-400"
      >
        <Coins size={16} className="mr-2" />
        {credits === 0 ? 'Top Up Credits Now' : 'Get More Credits'}
      </Button>
    </div>
  );
};

export default CreditDisplay;