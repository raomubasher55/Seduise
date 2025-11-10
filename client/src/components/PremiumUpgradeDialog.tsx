import React from 'react';
import { Crown, Zap, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import * as Dialog from '@radix-ui/react-dialog';

interface PremiumUpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'insufficient_credits' | 'general';
  currentCredits?: {
    text: number;
    audio: number;
  };
}

export const PremiumUpgradeDialog: React.FC<PremiumUpgradeDialogProps> = ({
  isOpen,
  onClose,
  trigger,
  currentCredits
}) => {
  const [, navigate] = useLocation();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    navigate('/premium-upgrade');
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 z-[9999]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[#1E1E1E] to-[#3D315B] rounded-2xl p-7 max-w-[480px] w-[90%] text-center text-[#F0E6DC] border border-gray-700 z-[10000] focus:outline-none">
          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Dialog.Close>

        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title and message based on trigger */}
        {trigger === 'insufficient_credits' ? (
          <>
            <h2 className="font-['Playfair_Display'] text-2xl font-bold mb-4 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] bg-clip-text text-transparent">
              Out of Credits!
            </h2>
            <p className="text-lg mb-6 text-[#F5F5F5]">
              You've used every credit in your current plan. Upgrade now to refresh your allowance instantly.
            </p>
            {currentCredits && (
              <div className="bg-[#121212] rounded-lg p-4 mb-6 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Current Balance:</p>
                <div className="flex justify-center space-x-6">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#D9B08C]">{currentCredits.text}</span>
                    <p className="text-xs text-gray-500">Text Credits</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#8B1E3F]">{currentCredits.audio}</span>
                    <p className="text-xs text-gray-500">Audio Credits</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="font-['Playfair_Display'] text-2xl font-bold mb-4 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] bg-clip-text text-transparent">
              Unlock Premium
            </h2>
            <p className="text-lg mb-6 text-[#F5F5F5]">
              Upgrade to boost your monthly credits, unlock premium voices, and access exclusive stories.
            </p>
          </>
        )}

        {/* Features */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-[#D9B08C] flex-shrink-0" />
            <span className="text-sm text-[#F5F5F5]">Higher monthly story & audio credits</span>
          </div>
          <div className="flex items-center space-x-3">
            <Star className="w-5 h-5 text-[#D9B08C] flex-shrink-0" />
            <span className="text-sm text-[#F5F5F5]">Premium narration voices & gallery access</span>
          </div>
          <div className="flex items-center space-x-3">
            <Crown className="w-5 h-5 text-[#D9B08C] flex-shrink-0" />
            <span className="text-sm text-[#F5F5F5]">Exclusive story drops and community perks</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleUpgradeClick}
            className="w-full bg-[#8B1E3F] hover:bg-[#a82b4f] text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Premium
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white py-2 text-sm hover:bg-[#2D2D2D] transition-all duration-200"
          >
            Maybe Later
          </button>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

