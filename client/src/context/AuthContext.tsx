import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';
import {
  apiGoogleConfig, apiLogin, apiMe, apiSignup, apiGoogleDemo, apiSendOtp, apiSignupSendOtp, apiVerifyOtp, apiLogout, setAuthToken,
} from '../lib/api';
import type { SendOtpResult } from '../lib/api';

const AUTH_USER_KEY = 'scamshield:auth-user';

function readStoredUser(): AuthUser | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  googleEnabled: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  sendOtp: (email: string) => Promise<SendOtpResult>;
  sendSignupOtp: (name: string, email: string, password: string) => Promise<SendOtpResult>;
  verifyOtp: (email: string, code: string) => Promise<AuthUser>;
  openGoogleLogin: () => Promise<void>;
  loginWithGoogleDemo: () => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [ready, setReady] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const persist = useCallback((token: string, nextUser: AuthUser) => {
    setAuthToken(token);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    } catch {
      // storage may be unavailable — token-only session still works
    }
    setUser(nextUser);
  }, []);

  useEffect(() => {
    apiGoogleConfig()
      .then((r) => setGoogleEnabled(r.enabled))
      .catch(() => setGoogleEnabled(false));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const token = getAuthTokenInternal();
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const { user: fresh } = await apiMe();
        if (!alive) return;
        persist(token, fresh);
      } catch {
        if (alive) {
          setAuthToken(null);
          try {
            localStorage.removeItem(AUTH_USER_KEY);
          } catch {
            // ignore
          }
          setUser(null);
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [persist]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type !== 'scamshield-google-auth') return;
      if (event.data?.token && event.data?.user) {
        persist(event.data.token, event.data.user as AuthUser);
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === AUTH_USER_KEY && event.newValue) {
        try {
          setUser(JSON.parse(event.newValue) as AuthUser);
        } catch {
          // ignore malformed storage
        }
      }
    }
    window.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }, [persist]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: nextUser } = await apiLogin(email, password);
      persist(token, nextUser);
      return nextUser;
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { token, user: nextUser } = await apiSignup(name, email, password);
      persist(token, nextUser);
      return nextUser;
    },
    [persist],
  );

  const sendOtp = useCallback(async (email: string) => {
    const result = await apiSendOtp(email);
    return result;
  }, []);

  const sendSignupOtp = useCallback(async (name: string, email: string, password: string) => {
    const result = await apiSignupSendOtp(name, email, password);
    return result;
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      const { token, user: nextUser } = await apiVerifyOtp(email, code);
      persist(token, nextUser);
      return nextUser;
    },
    [persist],
  );

  const openGoogleLogin = useCallback(async () => {
    const res = await fetch('/api/auth/google/url').catch(() => null);
    if (!res || !res.ok) throw new Error('Google sign-in is not configured yet. Try the demo option below.');
    const { url } = await res.json();
    const w = 520;
    const h = 640;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(url, 'scamshield-google', `width=${w},height=${h},left=${left},top=${top}`);
  }, []);

  const loginWithGoogleDemo = useCallback(async () => {
    const { token, user: nextUser } = await apiGoogleDemo();
    persist(token, nextUser);
    return nextUser;
  }, [persist]);

  const logout = useCallback(() => {
    apiLogout().catch(() => undefined);
    setAuthToken(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, googleEnabled, login, register, sendOtp, sendSignupOtp, verifyOtp, openGoogleLogin, loginWithGoogleDemo, logout }),
    [user, ready, googleEnabled, login, register, sendOtp, sendSignupOtp, verifyOtp, openGoogleLogin, loginWithGoogleDemo, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function getAuthTokenInternal(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('scamshield:auth-token') : null;
  } catch {
    return null;
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>.');
  return ctx;
}