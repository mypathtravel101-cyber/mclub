import { create } from 'zustand';
import { getToken, removeToken } from '@/lib/api-helpers';

export type Page =
  | 'dashboard'
  | 'products'
  | 'customers'
  | 'orders'
  | 'commissions'
  | 'events'
  | 'notices'
  | 'settings'
  | 'customer-detail'
  | 'users'
  | 'product-detail'
  | 'sub-products';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AppState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  preselectedProductId: string | null;
  setPreselectedProductId: (id: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  unreadNoticeCount: number;
  setUnreadNoticeCount: (count: number) => void;
  hydrate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  selectedProductId: null,
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  preselectedProductId: null,
  setPreselectedProductId: (id) => set({ preselectedProductId: id }),
  user: null,
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  unreadNoticeCount: 0,
  setUnreadNoticeCount: (count) => set({ unreadNoticeCount: count }),
  setUser: (user) => {
    if (!user) {
      removeToken();
    }
    set({ user });
  },
  hydrate: () => {
    const token = getToken();
    if (token && typeof window !== 'undefined') {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then((data) => {
          set({ user: data });
        })
        .catch(() => {
          removeToken();
          set({ user: null });
        });
    }
  },
}));
