import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isPremium?: boolean;
  credits?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  hasCredits: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const { data: currentUser, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !user,
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser as User);
    }
  }, [currentUser]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data.user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const response = await apiRequest("POST", "/api/auth/signup", { email, password, name });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUser(data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      setUser(null);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const signup = async (email: string, password: string, name: string) => {
    await signupMutation.mutateAsync({ email, password, name });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refreshUser = async () => {
    try {
      const result = await refetch();
      if (result.data) {
        setUser(result.data as User);
      }
      return result.data as User;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending,
        isAuthenticated: !!user,
        isPremium: !!user?.isPremium,
        hasCredits: (user?.credits ?? 0) > 0,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}