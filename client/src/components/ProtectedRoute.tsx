import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Redirect } from "wouter";
// import Logo from '@/components/Logo';


export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user , refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    refreshUser();
    return () => clearTimeout(timeout);
  }, [])
  
  return isLoading ? <div className="flex flex-col justify-center items-center h-screen">
    {/* <Logo className="animate-spin h-16 w-16" /> */}
    <div className="animate-spin h-16 w-16 border-4 border-t-4 border-gray-200 rounded-full"></div>
    <p className="text-gray-500 mt-4">Loading...</p>
  </div> : user ? children : <Redirect to="/login" />;
}
