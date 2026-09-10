import type { AnalysisPayload, Scenario, HistoryItem, AnalysisType, AuthUser } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const AUTH_TOKEN_KEY = 'scamshield:auth-token';

let authToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.error || 'The service is unreachable right now. Please try again.';
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return json as T;
}

export interface AnalyzeInput {
  type: 'text' | 'url';
  content: string;
}

export async function apiAnalyze(content: string, type: 'text' | 'url' = 'text'): Promise<{ analysis: AnalysisPayload }> {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ type, content }),
  });
}

export async function apiAnalyzeImage(
  dataUrl: string,
  visibleText?: string,
): Promise<{ analysis: AnalysisPayload }> {
  return request('/api/analyze/image', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, visibleText }),
  });
}

export async function apiGenerateSafeReply(content: string, category?: string): Promise<{ safeReply: string }> {
  return request('/api/generate-safe-reply', {
    method: 'POST',
    body: JSON.stringify({ content, category }),
  });
}

export async function apiHealth(): Promise<{ ok: boolean; status: string; mode: string }> {
  return request('/api/health');
}

export async function apiScenarios(): Promise<{ scenarios: Scenario[] }> {
  return request('/api/demo-scenarios');
}

export async function apiHistory(): Promise<{ items: HistoryItem[] }> {
  return request('/api/history');
}

export async function apiGetAnalysis(id: string): Promise<{ analysis: AnalysisPayload }> {
  return request(`/api/history/${encodeURIComponent(id)}`);
}

export async function apiDeleteAnalysis(id: string): Promise<{ ok: boolean }> {
  return request(`/api/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function apiClearHistory(): Promise<{ ok: boolean }> {
  return request('/api/history', { method: 'DELETE' });
}

export async function apiSignup(name: string, email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function apiMe(): Promise<{ user: AuthUser }> {
  return request('/api/auth/me');
}

export async function apiGoogleConfig(): Promise<{ enabled: boolean }> {
  return request('/api/auth/google/config');
}

export async function apiGoogleDemo(): Promise<{ token: string; user: AuthUser; demo: boolean }> {
  return request('/api/auth/google/demo', { method: 'POST' });
}

export interface SendOtpResult {
  ok: boolean;
  message: string;
  email: string;
  delivered: boolean;
  channel: string;
  resendAfter: number;
  expiresInMinutes: number;
}

export async function apiSendOtp(email: string): Promise<SendOtpResult> {
  return request('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function apiSignupSendOtp(name: string, email: string, password: string): Promise<SendOtpResult> {
  return request('/api/auth/signup-send-otp', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export async function apiVerifyOtp(email: string, code: string): Promise<{ ok: boolean; token: string; user: AuthUser; isNew: boolean }> {
  return request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) });
}

export async function apiLogout(): Promise<{ ok: boolean }> {
  return request('/api/auth/logout', { method: 'POST' });
}

export type { AnalysisType };