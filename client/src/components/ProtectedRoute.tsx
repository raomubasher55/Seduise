import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  console.log("ProtectedRoute user:", user);
  return user ? children : <Redirect to="/login" />;
}
