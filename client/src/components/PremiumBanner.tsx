import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const PremiumBanner = () => {
  const [, navigate] = useLocation();
  const { user, isPremium } = useAuth();

  // Don't show the banner if user is already premium
  if (isPremium) {
    return null;
  }

  const handleUpgradeClick = () => {
    if (user) {
      navigate('/premium');
    } else {
      navigate('/login?redirect=premium');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#3D315B] to-[#8B1E3F] p-4 z-50">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Crown className="text-[#D9B08C] mr-3" size={24} />
          <div>
            <h3 className="font-['Playfair_Display'] text-lg">Upgrade to Premium</h3>
            <p className="text-sm text-gray-300">Unlock unlimited stories, premium voices, and advanced features.</p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-2xl font-bold mr-4">$9.99<span className="text-sm font-normal">/month</span></span>
          <Button 
            className="bg-[#D9B08C] hover:bg-[#E5C7AD] text-[#121212] font-bold px-6 py-3 rounded-lg transition-colors"
            onClick={handleUpgradeClick}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumBanner;
