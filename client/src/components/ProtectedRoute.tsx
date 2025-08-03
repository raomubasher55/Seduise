import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { Link } from "wouter";


interface ProtectedRouteProps {
  children: React.ReactNode;
  premiumOnly?: boolean;
  minimumTier?: 'essentiel' | 'seduction' | 'intimacy';
}

export default function ProtectedRoute({ children, premiumOnly = false, minimumTier }: ProtectedRouteProps) {
  const { user , refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    refreshUser();
    return () => clearTimeout(timeout);
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin h-16 w-16 border-4 border-t-4 border-gray-200 rounded-full"></div>
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Check for minimum tier requirement (for premium gallery)
  if (minimumTier) {
    const tierLevels = { essentiel: 1, seduction: 2, intimacy: 3 };
    const userTierLevel = user?.subscription ? tierLevels[user.subscription as keyof typeof tierLevels] || 0 : 0;
    const requiredTierLevel = tierLevels[minimumTier];

    if (userTierLevel < requiredTierLevel) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20 p-8 text-center">
            <div className="flex justify-center mb-6">
              <Crown className="h-16 w-16 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Premium Gallery Access Required
            </h2>
            <p className="text-gray-400 mb-4">
              This premium content requires a {minimumTier === 'essentiel' ? 'Essentiel' : minimumTier.charAt(0).toUpperCase() + minimumTier.slice(1)} subscription or higher.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Current plan: {user?.subscription ? (user.subscription === 'essentiel' ? 'Essentiel' : user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)) : 'Free'}
            </p>
            <div className="space-y-3">
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Link href="/premium-upgrade">Upgrade Subscription</Link>
              </Button>
              <div>
                <Button asChild variant="outline">
                  <Link href="/credits">Buy Credits Instead</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  }

  // Original premium check (for general premium features)
  if (premiumOnly && !user.isPremium) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-[#1E1E1E] p-8 text-center">
          <div className="flex justify-center mb-6">
            <Lock className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Premium Content</h2>
          <p className="text-gray-400 mb-6">
            This section contains exclusive content available only to premium subscribers.
          </p>
          <Button asChild>
            <Link href="/premium-upgrade">Upgrade to Premium</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
