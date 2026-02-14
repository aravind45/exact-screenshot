import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: 'ADMIN' | 'ADVISOR' | 'ATTORNEY' | 'EXECUTOR' | 'HEIR';
  userType: string;
  state?: string;
  isTrialing?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAdvisor: boolean;
  isAttorney: boolean;
  isExecutor: boolean;
  isHeir: boolean;
  signIn: (token: string, userData: any) => void;
  signOut: () => void;
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
          // Ensure admin email gets 'ADMIN' role if no role is present
          if (!userData.role && userData.email?.toLowerCase() === 'aravind45@gmail.com') {
            userData.role = 'ADMIN';
          }
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

  // Removed the old signUp function as per the instruction's implied change in AuthContextType

  const signIn = (token: string, userData: any) => {
    localStorage.setItem("auth_token", token);
    // Ensure admin email gets 'ADMIN' role if no role is present
    if (!userData.role && userData.email?.toLowerCase() === 'aravind45@gmail.com') {
      userData.role = 'ADMIN';
    }
    setUser(userData);
  };

  const signOut = () => {
    try {
      // await api.logout(); // Assuming logout API call is handled elsewhere or not critical for local state
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
        // Ensure admin email gets 'ADMIN' role if no role is present
        if (!userData.role && userData.email?.toLowerCase() === 'aravind45@gmail.com') {
          userData.role = 'ADMIN';
        }
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.email?.toLowerCase() === 'aravind45@gmail.com';
  const isAdvisor = user?.role === 'ADVISOR' || isAdmin;
  const isAttorney = user?.role === 'ATTORNEY' || isAdmin;
  const isExecutor = user?.role === 'EXECUTOR' || isAdmin;
  const isHeir = user?.role === 'HEIR' || isAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isAdvisor,
      isAttorney,
      isExecutor,
      isHeir,
      signIn,
      signOut,
      refreshUser
    }}>
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
