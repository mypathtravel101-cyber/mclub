import { useAppStore } from '@/store/app';

export function fetchWithAuth(url: string, options?: RequestInit) {
  const user = useAppStore.getState().user;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': user?.id || '',
      ...options?.headers,
    },
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}
