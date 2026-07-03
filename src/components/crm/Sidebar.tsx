'use client';

import { useEffect } from 'react';
import { useAppStore, type Page } from '@/store/app';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Package,
  Users,
  UserCog,
  ShoppingCart,
  DollarSign,
  Calendar,
  Megaphone,

  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithAuth } from '@/lib/api-helpers';
import Link from 'next/link';

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode; roles: string[] }[] = [
  { page: 'dashboard', label: '儀表板', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'director'] },
  { page: 'users', label: '用戶管理', icon: <UserCog className="h-5 w-5" />, roles: ['admin'] },
  { page: 'products', label: '產品管理', icon: <Package className="h-5 w-5" />, roles: ['admin', 'director'] },
  { page: 'customers', label: '客戶管理', icon: <Users className="h-5 w-5" />, roles: ['admin', 'director'] },
  { page: 'orders', label: '訂單管理', icon: <ShoppingCart className="h-5 w-5" />, roles: ['admin', 'director'] },
  { page: 'commissions', label: '佣金管理', icon: <DollarSign className="h-5 w-5" />, roles: ['admin'] },
  { page: 'events', label: '活動管理', icon: <Calendar className="h-5 w-5" />, roles: ['admin', 'director'] },
  { page: 'notices', label: '📢 公告', icon: <Megaphone className="h-5 w-5" />, roles: ['admin', 'director'] },

  { page: 'settings', label: '系統設定', icon: <Settings className="h-5 w-5" />, roles: ['admin', 'director'] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: '管理員',
  director: '總監',
};

export function Sidebar() {
  const { currentPage, setCurrentPage, user, setUser, sidebarOpen, setSidebarOpen, unreadNoticeCount, setUnreadNoticeCount } =
    useAppStore();

  // Fetch unread notification count periodically
  useEffect(() => {
    if (!user) return;

    let lastFetch = 0;
    const MIN_INTERVAL = 15_000; // minimum 15s between fetches

    const fetchUnread = () => {
      const now = Date.now();
      if (now - lastFetch < MIN_INTERVAL) return; // debounce
      lastFetch = now;
      fetchWithAuth('/api/notifications/unread-count')
        .then((data) => {
          setUnreadNoticeCount(data.count ?? 0);
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // refresh every 30s

    // Also refresh when the window regains focus (debounced)
    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, setUnreadNoticeCount]);

  // Auto-close the sidebar on initial mount for mobile/tablet (< lg = 1024px).
  // The store defaults sidebarOpen=true which is correct for desktop, but on
  // phones the sidebar is `position: fixed` and would overlay content.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    // Intentionally empty dep array — only run once on mount.
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card transition-all duration-300',
          // Mobile (< lg): slide off-canvas when closed (instead of shrinking to w-16,
          // which used to permanently overlay the main content).
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop (>= lg): always in flex flow, width toggles between rail and full.
          'lg:relative lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'lg:w-64' : 'lg:w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-amber-600" />
              <span className="text-lg font-bold tracking-tight">MCLUB</span>
              <span className="text-xs text-muted-foreground">CRM</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {NAV_ITEMS.filter(item => item.roles.includes(user?.role || '')).map(({ page, label, icon }) => (
              <Button
                key={page}
                variant={currentPage === page ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 relative',
                  !sidebarOpen && 'justify-center px-2'
                )}
                aria-label={label}
                title={label}
                onClick={() => {
                  setCurrentPage(page);
                  setSidebarOpen(false);
                }}
              >
                {icon}
                {sidebarOpen && <span>{label}</span>}
                {page === 'notices' && unreadNoticeCount > 0 && (
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white',
                      sidebarOpen ? 'ml-auto' : 'absolute -top-1 -right-1'
                    )}
                  >
                    {unreadNoticeCount > 99 ? '99+' : unreadNoticeCount}
                  </span>
                )}
              </Button>
            ))}

            {/* Divider */}
            <div className="my-2 px-3">
              <div className="border-t border-border" />
            </div>

            {/* Risk Model Link */}
            <Link href="/risk-model">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3',
                  !sidebarOpen && 'justify-center px-2'
                )}
                aria-label="風險評估"
                title="風險評估"
              >
                <Home className="h-5 w-5" />
                {sidebarOpen && <span>風險評估</span>}
              </Button>
            </Link>
          </nav>
        </ScrollArea>

        {/* Toggle sidebar (desktop) */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-50 hidden h-6 w-6 rounded-full border bg-background shadow-sm lg:flex"
          aria-label={sidebarOpen ? '收起側邊欄' : '展開側邊欄'}
          title={sidebarOpen ? '收起側邊欄' : '展開側邊欄'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        {/* User section */}
        {user && (
          <div className="border-t border-border p-4">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {ROLE_LABELS[user.role] || user.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="登出"
                  title="登出"
                  onClick={() => setUser(null)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-full"
                aria-label="登出"
                title="登出"
                onClick={() => setUser(null)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
