import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Volume2, Crown, Plus } from 'lucide-react';

interface CreditDisplayProps {
  textCredits: number;
  audioCredits: number;
  isPremium?: boolean;
  onTopUp?: () => void;
}

export default function CreditDisplay({ 
  textCredits, 
  audioCredits, 
  isPremium = false,
  onTopUp 
}: CreditDisplayProps) {
  const totalCredits = textCredits + audioCredits;
  
  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] border-gray-700">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] rounded-lg">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#F0E6DC]">Your Credits</h3>
          </div>
          {isPremium && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] px-2 py-1 rounded-full">
              <Crown className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-medium text-white">Premium</span>
            </div>
          )}
        </div>
        
        {/* Credits Display */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#121212] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-[#D9B08C]" />
              <span className="text-sm text-gray-400">Text</span>
            </div>
            <div className="text-2xl font-bold text-[#D9B08C]">{textCredits}</div>
            <div className="text-xs text-gray-500">for stories</div>
          </div>
          
          <div className="bg-[#121212] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-[#8B1E3F]" />
              <span className="text-sm text-gray-400">Audio</span>
            </div>
            <div className="text-2xl font-bold text-[#8B1E3F]">{audioCredits}</div>
            <div className="text-xs text-gray-500">for narration</div>
          </div>
        </div>
        
        {/* Total Display */}
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400">Total Credits Available</div>
          <div className="text-xl font-bold text-[#F0E6DC]">{totalCredits}</div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 text-center">
          {isPremium 
            ? "Your premium credits renew monthly with your subscription."
            : "Purchase more credits to create additional stories and audio content."
          }
        </p>
        
        {/* Top Up Button */}
        {onTopUp && (
          <Button 
            onClick={onTopUp}
            className="w-full bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] hover:from-[#8B1E3F] hover:to-[#D9B08C] text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isPremium ? "Buy More Credits" : "Get Premium"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}