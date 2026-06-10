import { create } from 'zustand';

export type Page =
  | 'dashboard'
  | 'products'
  | 'customers'
  | 'orders'
  | 'commissions'
  | 'events'
  | 'notifications'
  | 'settings';

interface AppState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  setUser: (user: AppState['user']) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  user: null,
  setUser: (user) => set({ user }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
