'use client';

import { useAppStore } from '@/store/app';
import { Sidebar } from '@/components/crm/Sidebar';
import { LoginPage } from '@/components/crm/LoginPage';
import { DashboardPage } from '@/components/crm/DashboardPage';
import { ProductsPage } from '@/components/crm/ProductsPage';
import { CustomersPage } from '@/components/crm/CustomersPage';
import { CustomerDetailPage } from '@/components/crm/CustomerDetailPage';
import { OrdersPage } from '@/components/crm/OrdersPage';
import { CommissionsPage } from '@/components/crm/CommissionsPage';
import { EventsPage } from '@/components/crm/EventsPage';
import { NoticesPage } from '@/components/crm/NoticesPage';
import { SettingsPage } from '@/components/crm/SettingsPage';
import { ProductDetailPage } from '@/components/crm/ProductDetailPage';
import { SubProductsPage } from '@/components/crm/SubProductsPage';
import { UsersPage } from '@/components/crm/UsersPage';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

function Header() {
  const { user, currentPage, setSidebarOpen, selectedCustomerId, unreadNoticeCount, setCurrentPage } = useAppStore();

  const PAGE_TITLES: Record<string, string> = {
    dashboard: '儀表板',
    products: '產品管理',
    customers: '客戶管理',
    'customer-detail': '客戶詳情',
    orders: '訂單管理',
    commissions: '佣金管理',
    events: '活動管理',
    users: '用戶管理',
    notices: '📢 群組公告',
    settings: '系統設定',
    'product-detail': '產品詳情',
    'sub-products': '子產品',
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="truncate text-lg font-semibold">
          {currentPage === 'customer-detail' ? '客戶詳情' : PAGE_TITLES[currentPage]}
        </h2>
        {currentPage !== 'notices' && unreadNoticeCount > 0 && (
          <button
            className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            onClick={() => setCurrentPage('notices')}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {unreadNoticeCount > 99 ? '99+' : unreadNoticeCount} 則未讀公告
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
          {user?.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}

function PageContent() {
  const { currentPage, selectedCustomerId, setCurrentPage, setSelectedCustomerId } = useAppStore();

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />;
    case 'products':
      return <ProductsPage />;
    case 'customers':
      return <CustomersPage />;
    case 'customer-detail':
      return selectedCustomerId ? (
        <CustomerDetailPage
          customerId={selectedCustomerId}
          onBack={() => {
            setSelectedCustomerId(null);
            setCurrentPage('customers');
          }}
        />
      ) : (
        <CustomersPage />
      );
    case 'orders':
      return <OrdersPage />;
    case 'commissions':
      return <CommissionsPage />;
    case 'events':
      return <EventsPage />;
    case 'users':
      return <UsersPage />;
    case 'notices':
      return <NoticesPage />;
    case 'settings':
      return <SettingsPage />;
    case 'product-detail':
      return <ProductDetailPage />;
    case 'sub-products':
      return <SubProductsPage />;
    default:
      return <DashboardPage />;
  }
}

export default function Home() {
  const { user, hydrate } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Hydrate on mount (client-only)
  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [hydrate]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          <p className="text-sm text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageContent />
        </main>
      </div>
    </div>
  );
}
