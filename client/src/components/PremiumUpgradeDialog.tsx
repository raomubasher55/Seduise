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
    navigate('/subscription');
    onClose();
  };

  const handleBuyCreditsClick = () => {
    navigate('/credits');
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
              You've used all your credits. Choose how you'd like to continue creating amazing stories.
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
              Get unlimited story generation, premium voices, and exclusive features.
            </p>
          </>
        )}

        {/* Features */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-[#D9B08C] flex-shrink-0" />
            <span className="text-sm text-[#F5F5F5]">Unlimited story generation</span>
          </div>
          <div className="flex items-center space-x-3">
            <Star className="w-5 h-5 text-[#D9B08C] flex-shrink-0" />
            <span className="text-sm text-[#F5F5F5]">Premium voice narration</span>
          </div>
          <div className="flex items-center space-x-3">
            <Crown className="w-5 h-5 text-[#D9B08C] flex-shrink-0" />
            <span className="text-sm text-[#F5F5F5]">Exclusive story categories</span>
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
          
          {trigger === 'insufficient_credits' && (
            <button
              onClick={handleBuyCreditsClick}
              className="w-full border border-[#D9B08C] text-[#D9B08C] hover:bg-[#D9B08C] hover:text-[#1E1E1E] py-3 rounded-lg transition-all duration-200 flex items-center justify-center bg-transparent"
            >
              <Zap className="w-5 h-5 mr-2" />
              Buy More Credits
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white py-2 text-sm hover:bg-[#2D2D2D] transition-all duration-200"
          >
            Maybe Later
          </button>
        </div>

        {/* Special offer (optional) */}
        {trigger === 'insufficient_credits' && (
          <div className="mt-6 p-3 bg-gradient-to-r from-[#D9B08C]/20 to-[#8B1E3F]/20 rounded-lg border border-[#D9B08C]/30">
            <p className="text-xs text-[#D9B08C]">
              ✨ First-time premium upgrade gets 50% off your first month!
            </p>
          </div>
        )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};