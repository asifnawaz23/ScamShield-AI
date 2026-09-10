import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setAuthToken } from '../lib/api';
import type { AuthUser } from '../types';
import { Spinner } from '../components/ui/primitives';

const AUTH_USER_KEY = 'scamshield:auth-user';

export function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = params.get('error');
    const token = params.get('token');
    const rawUser = params.get('user');

    if (error || !token) {
      logout();
      historyCleanup();
      const target = typeof window.opener === 'object' && window.opener ? null : '/login?google=error';
      if (target) navigate(target, { replace: true });
      else window.close();
      return;
    }

    let user: AuthUser | null = null;
    try {
      user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
    } catch {
      user = null;
    }

    setAuthToken(token);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch {
      // token-only session still works
    }

    cleanUrl();

    if (typeof window.opener === 'object' && window.opener) {
      window.opener.postMessage({ type: 'scamshield-google-auth', token, user }, window.origin);
      window.close();
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, logout, params]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Spinner className="size-6" />
        <p className="text-sm">Completing your sign-in…</p>
      </div>
    </div>
  );
}

function cleanUrl() {
  const clean = window.location.pathname;
  window.history.replaceState({}, '', clean);
}

function historyCleanup() {
  try {
    window.history.replaceState({}, '', '/login');
  } catch {
    // ignore
  }
}