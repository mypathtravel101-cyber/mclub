import type { User, Client, Order, Commission, Product, TimelineEvent } from './types';

const API_BASE = '/api';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '請求失敗');
  }
  return data;
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(userId: string): Promise<{ user: User }> {
  return apiFetch(`/auth/me?userId=${userId}`);
}

export async function seedDatabase(): Promise<Record<string, unknown>> {
  return apiFetch('/seed', { method: 'POST' });
}

export async function getClients(userId: string): Promise<{ clients: Client[] }> {
  return apiFetch(`/clients?userId=${userId}`);
}

export async function createClient(userId: string, data: Partial<Client>): Promise<{ client: Client }> {
  return apiFetch(`/clients?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getClient(id: string): Promise<{ client: Client & { orders: Order[]; timelineEvents: TimelineEvent[] } }> {
  return apiFetch(`/clients/${id}`);
}

export async function addTimelineEvent(clientId: string, userId: string, data: { eventType: string; title: string; description?: string }): Promise<{ event: TimelineEvent }> {
  return apiFetch(`/clients/${clientId}/timeline?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOrders(userId: string, status?: string): Promise<{ orders: Order[] }> {
  const statusParam = status ? `&status=${status}` : '';
  return apiFetch(`/orders?userId=${userId}${statusParam}`);
}

export async function createOrder(userId: string, data: { productId: string; clientId: string; amount: string; currency?: string; notes?: string }): Promise<{ order: Order }> {
  return apiFetch(`/orders?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrderStatus(orderId: string, userId: string, status: string): Promise<{ order: Order }> {
  return apiFetch(`/orders/${orderId}?userId=${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function settleOrder(orderId: string, userId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/orders/${orderId}/settle?userId=${userId}`, { method: 'POST' });
}

export async function getCommissions(userId: string, status?: string): Promise<{ commissions: Commission[] }> {
  const statusParam = status ? `&status=${status}` : '';
  return apiFetch(`/commissions?userId=${userId}${statusParam}`);
}

export async function getProducts(userId?: string): Promise<{ products: Product[] }> {
  const userIdParam = userId ? `?userId=${userId}` : '';
  return apiFetch(`/products${userIdParam}`);
}

export async function getDashboardData(role: string, userId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/dashboard/${role}?userId=${userId}`);
}

export async function getUsers(userId: string): Promise<{ users: (User & { _count: { ownedProducts: number; clients: number; orders: number; commissions: number } })[] }> {
  return apiFetch(`/users?userId=${userId}`);
}
