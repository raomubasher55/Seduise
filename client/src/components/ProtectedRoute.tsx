import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Redirect } from "wouter";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user , refreshUser } = useAuth();
  useEffect(() => {
    refreshUser();
  }, [refreshUser])
  
  return user ? children : <Redirect to="/login" />;
}
