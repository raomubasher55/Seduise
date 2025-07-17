import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
// import Logo from '@/components/Logo';


export default function ProtectedRoute({ children, premiumOnly = false }: { children: React.ReactNode, premiumOnly?: boolean }) {
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
            <Link href="/subscription">Upgrade to Premium</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
