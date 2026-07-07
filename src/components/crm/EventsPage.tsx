'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { fetchWithAuth } from '@/lib/api-helpers';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';
import { Plus, MapPin, Users, CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, Calendar, ImagePlus, X, Upload, Trash2, Link2, ClipboardList, Check, UserCheck, UserX, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { zhHK } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  location: string | null;
  maxAttendees: number;
  imageUrl: string | null;
  status: string;
  _count: { participants: number };
  totalAttendees?: number;
  participants: { user: { id: string; name: string } }[];
}

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  guests: number;
  seats: number;
  notes: string | null;
  status: string;
  createdAt: string;
}

interface RegistrationsResponse {
  eventTitle: string;
  registrations: Registration[];
  summary: {
    total: number;
    registered: number;
    attended: number;
    cancelled: number;
    seatsTaken: number;
    maxAttendees: number;
  };
}

const DEFAULT_LOCATION = '香港九龍尖東科學館道1號康宏廣場1A舖';

const TYPE_LABELS: Record<string, string> = {
  seminar: '研討會',
  webinar: '網絡研討會',
  meeting: '會議',
  training: '培訓',
};

const TYPE_COLORS: Record<string, string> = {
  seminar: 'bg-blue-100 text-blue-800 border-blue-300',
  webinar: 'bg-purple-100 text-purple-800 border-purple-300',
  meeting: 'bg-green-100 text-green-800 border-green-300',
  training: 'bg-amber-100 text-amber-800 border-amber-300',
};

const TYPE_DOT_COLORS: Record<string, string> = {
  seminar: 'bg-blue-500',
  webinar: 'bg-purple-500',
  meeting: 'bg-green-500',
  training: 'bg-amber-500',
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const emptyForm = {
  title: '',
  description: '',
  type: 'seminar',
  date: '',
  location: '',
  maxAttendees: '50',
};

/**
 * Returns the current local datetime in the format expected by
 * <input type="datetime-local">: 'YYYY-MM-DDTHH:mm' (no seconds, no timezone).
 *
 * Used as the `min` attribute on the date picker so users can't select
 * a past date/time when creating a new event. We compute this fresh on
 * every render (cheap) so the cutoff stays current even if the dialog
 * is left open across midnight.
 *
 * Note: we deliberately use local time (not UTC) because the input's
 * value is interpreted as local time by the browser. Mixing UTC here
 * would allow off-by-one selections near timezone boundaries.
 */
function getMinDateTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function EventsPage() {
  const { toast } = useToast();
  const { setUnreadNoticeCount, user } = useAppStore();
  // Both admin and director can delete (matches the API permission).
  // The store already has user.role — we use it to show/hide delete buttons.
  const canDelete = user?.role === 'admin' || user?.role === 'director';
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Track which event is currently being deleted (by id) so we can
  // show a per-button spinner and prevent double-clicks
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Copy-link feedback state: which event's link was just copied (cleared after 2s)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Registrations dialog state
  const [regDialogEvent, setRegDialogEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regSummary, setRegSummary] = useState<RegistrationsResponse['summary'] | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regUpdatingId, setRegUpdatingId] = useState<string | null>(null);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = () => {
    setLoading(true);
    setError('');
    fetchWithAuth<{ data?: Event[] }>('/api/events').then((res) => {
      setEvents(res.data || []);
    }).catch((e: Error) => {
      setError(e.message || '載入失敗');
    }).finally(() => setLoading(false));
  };

  // Delete an event by id. Confirms first; on success, removes from local
  // state without a full reload. Both admin and director can delete (API
  // enforces the same permission).
  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!canDelete) {
      toast({
        title: '權限不足',
        description: '只有管理員或總監可以刪除活動',
        variant: 'destructive',
      });
      return;
    }

    // Browser confirm — simpler than a custom dialog for a destructive action.
    // Using window.confirm here is intentional: it's a blocking call that
    // prevents accidental bulk deletions, and the title gives clear context.
    const confirmed = window.confirm(
      `確定要刪除活動「${eventTitle}」嗎？\n\n此操作無法復原，所有相關的報名紀錄也會一併刪除。`
    );
    if (!confirmed) return;

    setDeletingId(eventId);
    try {
      await fetchWithAuth(`/api/events/${eventId}`, { method: 'DELETE' });
      // Remove from local state immediately for snappy UI
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast({
        title: '活動已刪除',
        description: `「${eventTitle}」已成功刪除`,
      });
    } catch (e: unknown) {
      const err = e as Error;
      const msg = err.message || '';
      // If the API says the event no longer exists, remove it from
      // local state so the stale card disappears from the calendar.
      if (msg.includes('活動不存在')) {
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
        toast({
          title: '活動已不存在',
          description: `「${eventTitle}」已被移除`,
        });
      } else {
        toast({
          title: '刪除失敗',
          description: msg || '請稍後再試',
          variant: 'destructive',
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchWithAuth<{ data?: Event[] }>('/api/events').then((res) => {
      setEvents(res.data || []);
      setLoading(false);
    }).catch((e: Error) => {
      setError(e.message || '載入失敗');
      setLoading(false);
    });
  }, []);

  // Group events by date for calendar
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((e) => {
      const dateKey = format(new Date(e.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(e);
    });
    return map;
  }, [events]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  }, [selectedDate, eventsByDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast({ title: '格式錯誤', description: '只支援 JPG、PNG、GIF、WebP 格式', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImageUrl(''); // clear URL input when file selected
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Compress image to tiny base64 for Vercel body limit
  const compressToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        c.width = w; c.height = h;
        c.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.3));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAdd = async () => {
    try {
      // Defense-in-depth: even though the date picker has min={now},
      // browsers may not enforce it in all cases (e.g. programmatic
      // value changes, older browsers). Reject past dates explicitly.
      const selectedDate = new Date(form.date);
      const now = new Date();
      if (selectedDate.getTime() <= now.getTime()) {
        toast({
          title: '日期無效',
          description: '活動時間必須為目前時間之後',
          variant: 'destructive',
        });
        return;
      }

      // Determine final image URL: URL input > compressed file upload > none
      let finalImageUrl: string | undefined;
      if (imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      } else if (imageFile) {
        try {
          const b64 = await compressToBase64(imageFile);
          if (b64.length > 400 * 1024) {
            toast({ title: '圖片過大', description: '請使用圖片連結代替上傳', variant: 'destructive' });
            return;
          }
          finalImageUrl = b64;
        } catch {
          toast({ title: '圖片處理失敗', description: '請使用圖片連結代替', variant: 'destructive' });
          return;
        }
      }

      console.log('[Event] Creating event, image:', finalImageUrl ? `${(finalImageUrl.length / 1024).toFixed(0)}KB` : 'none');
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mclub_crm_token')}`,
        },
        body: JSON.stringify({
          ...form,
          maxAttendees: parseInt(form.maxAttendees),
          date: new Date(form.date).toISOString(),
          status: 'upcoming',
          imageUrl: finalImageUrl,
        }),
      });
      if (!res.ok) {
        let errMsg = `伺服器錯誤 (${res.status})`;
        try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
        throw new Error(errMsg);
      }
      setOpen(false);
      resetForm();
      loadEvents();
      // Refresh unread count so the red dot appears on sidebar
      fetchWithAuth<{ count?: number }>('/api/notifications/unread-count')
        .then((data) => setUnreadNoticeCount(data.count ?? 0))
        .catch(() => {});
      toast({ title: '活動已建立', description: '新活動已成功建立' });
    } catch (e: unknown) {
      const err = e as Error;
      toast({ title: '建立失敗', description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Build the public registration URL for an event.
  // Uses window.location.origin so it works on both dev (localhost:3000)
  // and production (https://mclubcrm.space-z.ai).
  const buildRegisterUrl = (eventId: string): string => {
    if (typeof window === 'undefined') return `/events/${eventId}/register`;
    return `${window.location.origin}/events/${eventId}/register`;
  };

  // Copy registration link to clipboard. Uses navigator.clipboard with a
  // fallback to a hidden textarea + execCommand for older browsers.
  const handleCopyLink = async (eventId: string) => {
    const url = buildRegisterUrl(eventId);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-HTTPS contexts (e.g. dev over HTTP)
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: '連結已複製', description: '可貼上到 WhatsApp / 電郵發送給客戶' });
    } catch {
      // Last resort: open in a new window so user can copy manually
      window.open(url, '_blank');
      toast({ title: '無法複製', description: '已在新視窗開啟報名頁面，請手動複製網址' });
    }
  };

  // Open the registrations dialog for an event — fetches the list
  // from /api/events/[id]/registrations (auth required).
  const handleViewRegistrations = async (event: Event) => {
    setRegDialogEvent(event);
    setRegLoading(true);
    setRegistrations([]);
    setRegSummary(null);
    try {
      const data = await fetchWithAuth<RegistrationsResponse>(`/api/events/${event.id}/registrations`);
      setRegistrations(data.registrations || []);
      setRegSummary(data.summary || null);
    } catch (e) {
      const err = e as Error;
      toast({
        title: '讀取失敗',
        description: err.message || '無法讀取報名名單',
        variant: 'destructive',
      });
      setRegDialogEvent(null);
    } finally {
      setRegLoading(false);
    }
  };

  // Update a registration's status (check-in / undo / cancel / revive).
  // Optimistically updates local state for snappy UI; rolls back on error.
  const handleUpdateRegistration = async (
    eventId: string,
    regId: string,
    newStatus: 'registered' | 'attended' | 'cancelled'
  ) => {
    setRegUpdatingId(regId);
    const prev = registrations;
    // Optimistic update
    setRegistrations((curr) =>
      curr.map((r) => (r.id === regId ? { ...r, status: newStatus } : r))
    );
    try {
      await fetchWithAuth(`/api/events/${eventId}/registrations/${regId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      // Refresh summary counts from server (more accurate than local calc)
      const data = await fetchWithAuth<RegistrationsResponse>(`/api/events/${eventId}/registrations`);
      setRegistrations(data.registrations || []);
      setRegSummary(data.summary || null);
      const label = newStatus === 'attended' ? '已簽到' : newStatus === 'cancelled' ? '已取消' : '已恢復報名';
      toast({ title: '狀態已更新', description: label });
    } catch (e) {
      // Rollback
      setRegistrations(prev);
      const err = e as Error;
      toast({ title: '更新失敗', description: err.message, variant: 'destructive' });
    } finally {
      setRegUpdatingId(null);
    }
  };

  const monthLabel = format(currentMonth, 'yyyy年 M月', { locale: zhHK });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">活動管理</h1>
          <p className="text-muted-foreground">管理研討會、培訓及活動安排</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-0.5">
            <Button
              variant={view === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setView('calendar')}
            >
              <Calendar className="mr-1 h-3.5 w-3.5" />
              月曆
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setView('list')}
            >
              <LayoutGrid className="mr-1 h-3.5 w-3.5" />
              列表
            </Button>
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="mr-2 h-4 w-4" />
                新增活動
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增活動</DialogTitle>
                <p className="text-sm text-muted-foreground">填寫活動資訊及上傳宣傳海報</p>
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
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="活動簡介"
                    rows={3}
                    className="resize-none"
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
                      min={getMinDateTime()}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      活動時間必須為目前時間之後
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">地點</label>
                    <Select
                      value={form.location === DEFAULT_LOCATION ? 'default' : 'custom'}
                      onValueChange={(v) => setForm({ ...form, location: v === 'default' ? DEFAULT_LOCATION : '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">默認地點</SelectItem>
                        <SelectItem value="custom">其他地點</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.location === DEFAULT_LOCATION && (
                      <p className="mt-1 text-sm font-medium text-foreground">香港九龍尖東科學館道1號康宏廣場1A舖</p>
                    )}
                  </div>
                  {form.location !== DEFAULT_LOCATION && (
                    <div>
                      <label className="text-sm font-medium">自訂地點</label>
                      <Input
                        value={form.location === DEFAULT_LOCATION ? '' : form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="輸入活動地點"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">名額上限</label>
                    <Input
                      type="number"
                      value={form.maxAttendees}
                      onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium">活動海報 / 宣傳圖</label>
                  <div className="mt-1.5 space-y-2">
                    {/* URL input (recommended for Vercel) */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">貼上圖片連結（推薦）：</p>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); if (e.target.value) { setImageFile(null); setImagePreview(e.target.value); } else { setImagePreview(null); } }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex-1 h-px bg-border" />
                      <span>或上傳檔案（會自動壓縮）</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    {!imagePreview ? (
                      <div
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">點擊上傳圖片</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">支援 JPG、PNG、GIF、WebP</p>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                        <img
                          src={imagePreview}
                          alt="活動海報預覽"
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                          onClick={removeImage}
                          title="移除圖片"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    {imagePreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        更換圖片
                      </Button>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleAdd}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={!form.title || !form.date}
                >
                  確認新增
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadEvents}>重試</Button>
        </div>
      )}

      {/* Calendar View */}
      {!loading && !error && view === 'calendar' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar grid */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{monthLabel}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setCurrentMonth(new Date())}>
                    今日
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar cells */}
              <div className="grid grid-cols-7 border-t border-l">
                {calendarDays.map((day, i) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate.get(dateKey) || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={i}
                      className={cn(
                        'min-h-[80px] border-b border-r p-1.5 cursor-pointer transition-colors',
                        !isCurrentMonth && 'bg-muted/30',
                        isSelected && 'bg-amber-50',
                        isTodayDate && !isSelected && 'bg-blue-50/50',
                        'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            'text-xs font-medium inline-flex h-6 w-6 items-center justify-center rounded-full',
                            isTodayDate && 'bg-amber-600 text-white',
                            !isTodayDate && isCurrentMonth && 'text-foreground',
                            !isTodayDate && !isCurrentMonth && 'text-muted-foreground',
                            isSelected && !isTodayDate && 'bg-amber-200 text-amber-900'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{dayEvents.length}項</span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              'truncate rounded px-1.5 py-0.5 text-[10px] font-medium border',
                              TYPE_COLORS[ev.type]
                            )}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground text-center">
                            +{dayEvents.length - 2} 更多
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar: Selected date events or upcoming events */}
          <div className="space-y-4">
            {/* Selected date detail */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {selectedDate
                    ? format(selectedDate, 'M月d日 (EEE)', { locale: zhHK })
                    : '選擇日期查看活動'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-lg border p-3 space-y-2"
                        >
                          {/* Event poster thumbnail */}
                          {ev.imageUrl && (
                            <div className="rounded-md overflow-hidden bg-muted">
                              <img
                                src={ev.imageUrl}
                                alt={ev.title}
                                className="w-full h-32 object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn('h-2.5 w-2.5 rounded-full', TYPE_DOT_COLORS[ev.type])} />
                              <span className="text-sm font-medium">{ev.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={cn('text-[9px]', TYPE_COLORS[ev.type])}>
                                {TYPE_LABELS[ev.type]}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(ev.id);
                                }}
                                title="複製報名連結"
                              >
                                {copiedId === ev.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Link2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewRegistrations(ev);
                                }}
                                title="查看報名名單"
                              >
                                <ClipboardList className="h-3.5 w-3.5" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                  disabled={deletingId === ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(ev.id, ev.title);
                                  }}
                                  title="刪除活動"
                                >
                                  {deletingId === ev.id ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-3 w-3" />
                              <span>{new Date(ev.date).toLocaleString('zh-HK', { timeStyle: 'short' })}</span>
                            </div>
                            {ev.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3" />
                                <span>{ev.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3" />
                              <span>{ev.totalAttendees ?? ev._count.participants}/{ev.maxAttendees} 人</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground">
                      <CalendarDays className="h-6 w-6 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">此日無活動</p>
                    </div>
                  )
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    <CalendarDays className="h-6 w-6 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">點擊日曆上的日期</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming events list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">即將舉辦</CardTitle>
              </CardHeader>
              <CardContent>
                {events.filter(e => e.status === 'upcoming').length > 0 ? (
                  <div className="space-y-2">
                    {events
                      .filter(e => e.status === 'upcoming')
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 5)
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedDate(new Date(ev.date))}
                        >
                          {ev.imageUrl ? (
                            <img
                              src={ev.imageUrl}
                              alt={ev.title}
                              className="h-9 w-9 rounded object-cover shrink-0 bg-muted"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className={cn('h-2 w-2 rounded-full shrink-0', TYPE_DOT_COLORS[ev.type])} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{ev.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(ev.date), 'M/d HH:mm')}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn('text-[9px] shrink-0', TYPE_COLORS[ev.type])}>
                            {TYPE_LABELS[ev.type]}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <p className="text-xs">暫無即將舉辦的活動</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && !error && view === 'list' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Card key={e.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {/* Event poster image */}
              {e.imageUrl && (
                <div className="w-full h-40 overflow-hidden bg-muted">
                  <img
                    src={e.imageUrl}
                    alt={e.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
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
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                      onClick={() => handleCopyLink(e.id)}
                      title="複製報名連結"
                    >
                      {copiedId === e.id ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => handleViewRegistrations(e)}
                      title="查看報名名單"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        disabled={deletingId === e.id}
                        onClick={() => handleDelete(e.id, e.title)}
                        title="刪除活動"
                      >
                        {deletingId === e.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
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
                    <span>{e.totalAttendees ?? e._count.participants} / {e.maxAttendees} 名參加者</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">暫無活動，點擊「新增活動」建立第一個活動</p>
        </div>
      )}

      {/* Registrations dialog — shown when director clicks the ClipboardList icon */}
      <Dialog
        open={!!regDialogEvent}
        onOpenChange={(v) => {
          if (!v) {
            setRegDialogEvent(null);
            setRegistrations([]);
            setRegSummary(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              報名名單
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {regDialogEvent?.title}
            </p>
          </DialogHeader>

          {/* Summary cards */}
          {regSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border bg-blue-50/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">已報名</p>
                <p className="text-lg font-bold text-blue-700">{regSummary.registered}</p>
              </div>
              <div className="rounded-lg border bg-emerald-50/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">已簽到</p>
                <p className="text-lg font-bold text-emerald-700">{regSummary.attended}</p>
              </div>
              <div className="rounded-lg border bg-red-50/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">已取消</p>
                <p className="text-lg font-bold text-red-700">{regSummary.cancelled}</p>
              </div>
              <div className="rounded-lg border bg-amber-50/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">座位</p>
                <p className="text-lg font-bold text-amber-700">
                  {regSummary.seatsTaken}<span className="text-xs font-normal text-muted-foreground"> / {regSummary.maxAttendees}</span>
                </p>
              </div>
            </div>
          )}

          {/* Registration list */}
          {regLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">尚無報名紀錄</p>
              <p className="text-xs mt-1">
                複製報名連結發送給客戶，客戶填寫後將顯示在此名單
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {registrations.map((r, idx) => (
                <div
                  key={r.id}
                  className={cn(
                    'rounded-lg border p-3 space-y-2',
                    r.status === 'attended' && 'bg-emerald-50/50 border-emerald-200',
                    r.status === 'cancelled' && 'bg-red-50/50 border-red-200 opacity-70',
                    r.status === 'registered' && 'bg-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground">#{idx + 1}</span>
                        <span className="font-medium text-sm">{r.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px]',
                            r.status === 'attended'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : r.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                          )}
                        >
                          {r.status === 'attended' ? '已簽到' : r.status === 'cancelled' ? '已取消' : '已報名'}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300">
                          {r.seats} 座位
                        </Badge>
                      </div>
                      <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <div className="truncate">
                          <span className="text-foreground/70">電郵：</span>
                          <a href={`mailto:${r.email}`} className="hover:text-blue-600 hover:underline">{r.email}</a>
                        </div>
                        {r.phone && (
                          <div className="truncate">
                            <span className="text-foreground/70">電話：</span>
                            <a href={`tel:${r.phone}`} className="hover:text-blue-600 hover:underline">{r.phone}</a>
                          </div>
                        )}
                        <div>
                          <span className="text-foreground/70">同行：</span>
                          {r.guests} 人
                        </div>
                        <div>
                          <span className="text-foreground/70">報名時間：</span>
                          {new Date(r.createdAt).toLocaleString('zh-HK', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      {r.notes && (
                        <div className="mt-2 rounded bg-muted/50 px-2 py-1.5 text-xs">
                          <span className="text-muted-foreground">備註：</span>
                          <span className="text-foreground/80">{r.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {r.status === 'registered' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          disabled={regUpdatingId === r.id}
                          onClick={() => regDialogEvent && handleUpdateRegistration(regDialogEvent.id, r.id, 'attended')}
                        >
                          <UserCheck className="mr-1 h-3 w-3" />
                          簽到
                        </Button>
                      )}
                      {r.status === 'attended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={regUpdatingId === r.id}
                          onClick={() => regDialogEvent && handleUpdateRegistration(regDialogEvent.id, r.id, 'registered')}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          撤銷簽到
                        </Button>
                      )}
                      {(r.status === 'registered' || r.status === 'attended') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={regUpdatingId === r.id}
                          onClick={() => regDialogEvent && handleUpdateRegistration(regDialogEvent.id, r.id, 'cancelled')}
                        >
                          <UserX className="mr-1 h-3 w-3" />
                          取消
                        </Button>
                      )}
                      {r.status === 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={regUpdatingId === r.id}
                          onClick={() => regDialogEvent && handleUpdateRegistration(regDialogEvent.id, r.id, 'registered')}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          恢復
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer with copy-link shortcut */}
          {regDialogEvent && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                客戶報名連結
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyLink(regDialogEvent.id)}
              >
                {copiedId === regDialogEvent.id ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    已複製
                  </>
                ) : (
                  <>
                    <Link2 className="mr-1.5 h-3.5 w-3.5" />
                    複製連結
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
