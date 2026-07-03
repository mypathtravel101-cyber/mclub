import { useAppStore } from '@/store/app';

const TOKEN_KEY = 'mclub_crm_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function fetchWithAuth<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };
  return fetch(url, {
    ...options,
    headers,
  }).then(async (res) => {
    if (res.status === 401) {
      // Token expired or invalid — force logout
      removeToken();
      useAppStore.getState().setUser(null);
      throw new Error('登入已過期，請重新登入');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '操作失敗');
    return data as T;
  });
}
