'use client';

import { useAppStore } from '@/store/app';
import { Sidebar } from '@/components/crm/Sidebar';
import { LoginPage } from '@/components/crm/LoginPage';
import { DashboardPage } from '@/components/crm/DashboardPage';
import { ProductsPage } from '@/components/crm/ProductsPage';
import { CustomersPage } from '@/components/crm/CustomersPage';
import { OrdersPage } from '@/components/crm/OrdersPage';
import { CommissionsPage } from '@/components/crm/CommissionsPage';
import { EventsPage } from '@/components/crm/EventsPage';
import { NotificationsPage } from '@/components/crm/NotificationsPage';
import { SettingsPage } from '@/components/crm/SettingsPage';
import { Button } from '@/components/ui/button';
import { Menu, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api-helpers';

function Header() {
  const { user, currentPage, setCurrentPage, setSidebarOpen } = useAppStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      let cancelled = false;
      fetchWithAuth(`/api/notifications?userId=${user.id}`).then((notifs: { read: boolean }[]) => {
        if (!cancelled) setUnreadCount(notifs.filter((n: { read: boolean }) => !n.read).length);
      });
      return () => { cancelled = true; };
    }
  }, [user, currentPage]);

  const PAGE_TITLES: Record<string, string> = {
    dashboard: '儀表板',
    products: '產品管理',
    customers: '客戶管理',
    orders: '訂單管理',
    commissions: '佣金管理',
    events: '活動管理',
    notifications: '通知中心',
    settings: '系統設定',
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{PAGE_TITLES[currentPage]}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setCurrentPage('notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center bg-amber-600 hover:bg-amber-600">
              {unreadCount}
            </Badge>
          )}
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
          {user?.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}

function PageContent() {
  const { currentPage } = useAppStore();

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />;
    case 'products':
      return <ProductsPage />;
    case 'customers':
      return <CustomersPage />;
    case 'orders':
      return <OrdersPage />;
    case 'commissions':
      return <CommissionsPage />;
    case 'events':
      return <EventsPage />;
    case 'notifications':
      return <NotificationsPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <DashboardPage />;
  }
}

export default function Home() {
  const { user } = useAppStore();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageContent />
        </main>
      </div>
    </div>
  );
}
