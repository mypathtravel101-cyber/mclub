'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchWithAuth } from '@/lib/api-helpers';
import { Plus, MapPin, Users, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  location: string | null;
  maxAttendees: number;
  status: string;
  _count: { participants: number };
  participants: { user: { id: string; name: string } }[];
}

const TYPE_LABELS: Record<string, string> = {
  seminar: '研討會',
  webinar: '網絡研討會',
  meeting: '會議',
  training: '培訓',
};

const TYPE_COLORS: Record<string, string> = {
  seminar: 'bg-blue-100 text-blue-800',
  webinar: 'bg-purple-100 text-purple-800',
  meeting: 'bg-green-100 text-green-800',
  training: 'bg-amber-100 text-amber-800',
};

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'seminar',
    date: '',
    location: '',
    maxAttendees: '50',
  });

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/api/events').then((d) => {
      if (!cancelled) setEvents(d);
    });
    return () => { cancelled = true; };
  }, []);

  const refreshEvents = () => {
    fetchWithAuth('/api/events').then(setEvents);
  };

  const handleAdd = async () => {
    await fetchWithAuth('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        maxAttendees: parseInt(form.maxAttendees),
        date: new Date(form.date).toISOString(),
        status: 'upcoming',
      }),
    });
    setOpen(false);
    setForm({ title: '', description: '', type: 'seminar', date: '', location: '', maxAttendees: '50' });
    refreshEvents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">活動管理</h1>
          <p className="text-muted-foreground">管理研討會、培訓及活動安排</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="mr-2 h-4 w-4" />
              新增活動
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增活動</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">活動名稱 *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="活動名稱"
                />
              </div>
              <div>
                <label className="text-sm font-medium">描述</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="活動簡介"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">類型</label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seminar">研討會</SelectItem>
                      <SelectItem value="webinar">網絡研討會</SelectItem>
                      <SelectItem value="meeting">會議</SelectItem>
                      <SelectItem value="training">培訓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">日期時間 *</label>
                  <Input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">地點</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="活動地點"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">名額上限</label>
                  <Input
                    type="number"
                    value={form.maxAttendees}
                    onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-amber-600 hover:bg-amber-700" disabled={!form.title || !form.date}>
                確認新增
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Card key={e.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className={cn('text-[10px]', TYPE_COLORS[e.type])}>
                      {TYPE_LABELS[e.type]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        e.status === 'upcoming'
                          ? 'bg-green-100 text-green-800'
                          : e.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {e.status === 'upcoming' ? '即將舉辦' : e.status === 'completed' ? '已完成' : '進行中'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {e.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>
              )}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{new Date(e.date).toLocaleString('zh-HK', { dateStyle: 'full', timeStyle: 'short' })}</span>
                </div>
                {e.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{e.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>{e._count.participants} / {e.maxAttendees} 名參加者</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
