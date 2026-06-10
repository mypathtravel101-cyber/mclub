'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api-helpers';
import { Bell, Check, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
  success: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
  error: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
};

export function NotificationsPage() {
  const { user } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      let cancelled = false;
      fetchWithAuth(`/api/notifications?userId=${user.id}`).then((d) => {
        if (!cancelled) setNotifications(d);
      });
      return () => { cancelled = true; };
    }
  }, [user]);

  const markRead = async (id: string) => {
    await fetchWithAuth('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ id, read: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter((n) => !n.read).map((n) => markRead(n.id))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">通知中心</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} 條未讀通知` : '所有通知已讀'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <Check className="mr-2 h-4 w-4" />
            全部標記為已讀
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
          return (
            <Card
              key={n.id}
              className={cn(
                'transition-all hover:shadow-sm',
                !n.read && 'border-l-4 border-l-amber-500 bg-amber-50/30'
              )}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className={cn('mt-0.5 rounded-lg p-2', config.color)}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium', !n.read && 'font-semibold')}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString('zh-HK')}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8"
                    onClick={() => markRead(n.id)}
                  >
                    標記已讀
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-20" />
            <p>暫無通知</p>
          </div>
        )}
      </div>
    </div>
  );
}
