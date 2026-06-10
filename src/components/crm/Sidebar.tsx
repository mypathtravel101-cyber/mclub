'use client';

import { useAppStore, type Page } from '@/store/app';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Megaphone,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: '儀表板', icon: <LayoutDashboard className="h-5 w-5" /> },
  { page: 'products', label: '產品管理', icon: <Package className="h-5 w-5" /> },
  { page: 'customers', label: '客戶管理', icon: <Users className="h-5 w-5" /> },
  { page: 'orders', label: '訂單管理', icon: <ShoppingCart className="h-5 w-5" /> },
  { page: 'commissions', label: '佣金管理', icon: <DollarSign className="h-5 w-5" /> },
  { page: 'events', label: '活動管理', icon: <Calendar className="h-5 w-5" /> },
  { page: 'notices', label: '📢 公告', icon: <Megaphone className="h-5 w-5" /> },
  { page: 'notifications', label: '通知中心', icon: <Bell className="h-5 w-5" /> },
  { page: 'settings', label: '系統設定', icon: <Settings className="h-5 w-5" /> },
];

const ROLE_LABELS: Record<string, string> = {
  admin: '管理員',
  agent: '代理',
  sme: 'SME負責人',
};

export function Sidebar() {
  const { currentPage, setCurrentPage, user, setUser, sidebarOpen, setSidebarOpen } =
    useAppStore();

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
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-card transition-all duration-300 lg:relative lg:z-auto',
          sidebarOpen ? 'w-64' : 'w-16'
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
            {NAV_ITEMS.map(({ page, label, icon }) => (
              <Button
                key={page}
                variant={currentPage === page ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  !sidebarOpen && 'justify-center px-2'
                )}
                onClick={() => {
                  setCurrentPage(page);
                  setSidebarOpen(false);
                }}
              >
                {icon}
                {sidebarOpen && <span>{label}</span>}
              </Button>
            ))}
          </nav>
        </ScrollArea>

        {/* Toggle sidebar (desktop) */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-50 hidden h-6 w-6 rounded-full border bg-background shadow-sm lg:flex"
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
