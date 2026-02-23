import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { api } from '@/lib/api';

// ── Session configuration ────────────────────────────────────────────────────
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;   // 2 hours idle → auto-logout
const AUTH_CHECK_INTERVAL_MS = 15 * 60 * 1000;       // Validate token every 15 min
const TOKEN_REFRESH_INTERVAL_MS = 60 * 60 * 1000;    // Refresh token every 1 hour of activity
const ACTIVITY_STORAGE_KEY = 'auth_last_activity';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: 'ADMIN' | 'ADVISOR' | 'ATTORNEY' | 'EXECUTOR' | 'HEIR';
  userType: string;
  state?: string;
  isTrialing?: boolean;
  emailVerifiedAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAdvisor: boolean;
  isAttorney: boolean;
  isExecutor: boolean;
  isHeir: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: string, userType?: string, deceasedName?: string, state?: string, estimatedValue?: string) => Promise<{ user: User | null; error: any }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  // ── Helper: stamp activity ───────────────────────────────────────────────
  const stampActivity = useCallback(() => {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, Date.now().toString());
  }, []);

  // ── Helper: check if session has been idle too long ──────────────────────
  const isSessionExpired = useCallback(() => {
    const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!lastActivity) return false; // No stamp yet = just logged in
    return Date.now() - parseInt(lastActivity, 10) > INACTIVITY_TIMEOUT_MS;
  }, []);

  // ── Silent logout (no navigation – used by timers) ──────────────────────
  const silentLogout = useCallback(async () => {
    console.log('[AUTH] Session expired — logging out');
    try { await api.logout(); } catch { /* ignore */ }
    localStorage.removeItem("auth_token");
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
    sessionStorage.removeItem("after_login_redirect");
    sessionStorage.removeItem("discovery_data");
    setUser(null);
    window.location.href = '/login?reason=session_expired';
  }, []);

  // ── Reset the inactivity timer ──────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    // Only set timer if user is logged in
    if (localStorage.getItem("auth_token")) {
      stampActivity();
      inactivityTimerRef.current = setTimeout(() => {
        silentLogout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [stampActivity, silentLogout]);

  // ── Periodic auth validation + token refresh ────────────────────────────
  useEffect(() => {
    if (!user) return;

    authCheckIntervalRef.current = setInterval(async () => {
      // 1. Check inactivity across tabs (uses localStorage timestamp)
      if (isSessionExpired()) {
        silentLogout();
        return;
      }

      // 2. Validate token is still valid on server
      try {
        await api.getMe();
      } catch {
        console.log('[AUTH] Token validation failed — logging out');
        silentLogout();
        return;
      }

      // 3. Sliding session: refresh token if active for > 1 hour
      const timeSinceRefresh = Date.now() - lastRefreshRef.current;
      if (timeSinceRefresh > TOKEN_REFRESH_INTERVAL_MS) {
        const result = await api.refreshToken();
        if (result?.token) {
          lastRefreshRef.current = Date.now();
          console.log('[AUTH] Token refreshed (sliding session)');
        }
      }
    }, AUTH_CHECK_INTERVAL_MS);

    return () => {
      if (authCheckIntervalRef.current) clearInterval(authCheckIntervalRef.current);
    };
  }, [user, isSessionExpired, silentLogout]);

  // ── Activity listeners (mouse, keyboard, touch, scroll) ─────────────────
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    resetInactivityTimer(); // Start the timer

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  // ── Cross-tab logout detection via storage event ─────────────────────────
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && !e.newValue) {
        // Another tab logged out — clear this tab too
        setUser(null);
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ── Init auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        // Check if session expired while tab was closed
        if (isSessionExpired()) {
          console.log('[AUTH] Session expired while away — clearing token');
          localStorage.removeItem("auth_token");
          localStorage.removeItem(ACTIVITY_STORAGE_KEY);
          setLoading(false);
          return;
        }

        try {
          const userData = await api.getMe();
          if (!userData.role && userData.email?.toLowerCase() === 'aravind45@gmail.com') {
            userData.role = 'ADMIN';
          }
          setUser(userData);
          stampActivity();
          lastRefreshRef.current = Date.now();
        } catch (error) {
          console.error("Auth init failed:", error);
          localStorage.removeItem("auth_token");
          localStorage.removeItem(ACTIVITY_STORAGE_KEY);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [isSessionExpired, stampActivity]);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      let userData = data.user;

      if (!userData.role && userData.email?.toLowerCase() === 'aravind45@gmail.com') {
        userData.role = 'ADMIN';
      }

      setUser(userData);
      stampActivity();
      lastRefreshRef.current = Date.now();
      return { user: userData, error: null };
    } catch (error: any) {
      console.error("Sign in failed:", error);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role?: string, userType?: string, deceasedName?: string, state?: string, estimatedValue?: string) => {
    try {
      const data = await api.register({ email, password, fullName, role, userType: userType as any, deceasedName, state, estimatedValue });
      let userData = data.user;

      if (!userData.role && userData.email?.toLowerCase() === 'aravind45@gmail.com') {
        userData.role = 'ADMIN';
      }

      setUser(userData);
      stampActivity();
      lastRefreshRef.current = Date.now();
      return { user: userData, error: null };
    } catch (error: any) {
      console.error("Sign up failed:", error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      sessionStorage.removeItem("after_login_redirect");
      sessionStorage.removeItem("discovery_data");
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (authCheckIntervalRef.current) clearInterval(authCheckIntervalRef.current);
      setUser(null);
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      if (userData) {
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
      signUp,
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
