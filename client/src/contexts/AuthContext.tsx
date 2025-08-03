import { createContext, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  isPremium: boolean;
  textCredits: number;
  audioCredits: number;
  unlockedChapters: { storyId: string; chapterNumber: number }[];
  authProvider: string;
  createdAt: string;
  updatedAt: string;
  subscription: string;
  stories: string[];
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
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        return await response.json();
      } catch (error) {
        localStorage.removeItem('token');
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.setQueryData(["/api/auth/me"], null);
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
    const result = await refetch();
    return result.data ?? null;
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading || loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending,
        isAuthenticated: !!user,
        isPremium: !!user?.isPremium,
        hasCredits: ((user?.textCredits ?? 0) > 0) || ((user?.audioCredits ?? 0) > 0),
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