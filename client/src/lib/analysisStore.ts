import type { AnalysisPayload, HistoryItem } from '../types';

const KEY = 'scamshield:analysis-store';
const MAX_STORE = 30;

export function saveAnalysisLocal(a: AnalysisPayload): void {
  try {
    const raw = localStorage.getItem(KEY);
    const store: Record<string, AnalysisPayload> = raw ? JSON.parse(raw) : {};
    store[a.id] = a;
    const ids = Object.keys(store);
    if (ids.length > MAX_STORE) {
      const toDrop = ids.slice(0, ids.length - MAX_STORE);
      toDrop.forEach((id) => delete store[id]);
    }
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage full or unavailable — analysis still returned to the caller
  }
}

export function getAnalysisLocal(id: string): AnalysisPayload | null {
  try {
    const raw = localStorage.getItem(KEY);
    const store: Record<string, AnalysisPayload> = raw ? JSON.parse(raw) : {};
    return store[id] ?? null;
  } catch {
    return null;
  }
}

export function listAnalysisLocal(): AnalysisPayload[] {
  try {
    const raw = localStorage.getItem(KEY);
    const store: Record<string, AnalysisPayload> = raw ? JSON.parse(raw) : {};
    return Object.values(store).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

export function removeAnalysisLocal(id: string): void {
  try {
    const raw = localStorage.getItem(KEY);
    const store: Record<string, AnalysisPayload> = raw ? JSON.parse(raw) : {};
    delete store[id];
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function clearAnalysisStore(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function mapToHistory(items: AnalysisPayload[]): HistoryItem[] {
  return items.map((a) => ({
    id: a.id,
    type: a.type,
    inputSummary: a.inputSummary,
    riskScore: a.riskScore,
    riskLevel: a.riskLevel,
    category: a.category.id,
    createdAt: a.createdAt,
  }));
}