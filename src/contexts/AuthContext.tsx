import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  userType?: "EXECUTOR" | "ADVISOR";
  state?: string;
  subscriptionStatus?: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED';
  subscriptionPlan?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  planId?: string;
  isTrialing?: boolean;
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role?: string, userType?: "EXECUTOR" | "ADVISOR") => Promise<{ user: User | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Auth init failed:", error);
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role?: string, userType?: "EXECUTOR" | "ADVISOR") => {
    try {
      const { user: newUser } = await api.register({ email, password, fullName, role, userType });
      setUser(newUser);
      return { user: newUser, error: null };
    } catch (error: any) {
      return { user: null, error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: existingUser } = await api.login(email, password);
      setUser(existingUser);
      return { user: existingUser, error: null };
    } catch (error: any) {
      return { user: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Sign out error:", error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local state even if API fails
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("after_login_redirect");
      sessionStorage.removeItem("discovery_data");
      setUser(null);
      
      // Navigate to landing page using window.location to ensure clean state
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
