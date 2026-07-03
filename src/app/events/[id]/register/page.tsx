'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, MapPin, Users, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Types ----------

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  location: string | null;
  maxAttendees: number;
  imageUrl: string | null;
  status: string;
  registered: number;
  available: number;
  isFull: boolean;
}

interface RegistrationResponse {
  id: string;
  eventTitle: string;
  name: string;
  email: string;
  guests: number;
  status: string;
}

interface ApiError {
  error: string;
  available?: number;
  requested?: number;
}

// ---------- Constants ----------

const TYPE_LABELS: Record<string, string> = {
  seminar: '研討會',
  webinar: '網絡研討會',
  meeting: '會議',
  training: '培訓',
};

// ---------- Hydration-safe hook ----------
// Avoids SSR/CSR mismatch by returning false on server, true on client.
const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// ---------- Component ----------

export default function EventRegisterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '0',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<RegistrationResponse | null>(null);
  const [submitError, setSubmitError] = useState('');

  // ---------- Load event info ----------
  useEffect(() => {
    if (!hydrated || !params.id) return;
    setLoading(true);
    fetch(`/api/events/${params.id}/public`)
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as ApiError;
          throw new Error(data.error || '活動不存在或已結束');
        }
        return res.json() as Promise<PublicEvent>;
      })
      .then((data) => {
        setEvent(data);
        setLoadError('');
      })
      .catch((e: Error) => {
        setLoadError(e.message);
      })
      .finally(() => setLoading(false));
  }, [hydrated, params.id]);

  // ---------- Submit registration ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    // Client-side validation (server also validates via zod)
    if (!form.name.trim()) {
      setSubmitError('請輸入姓名');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSubmitError('請輸入有效的電郵地址');
      return;
    }
    const guests = parseInt(form.guests) || 0;
    if (guests < 0 || guests > 20) {
      setSubmitError('同行人數必須為 0-20');
      return;
    }
    if (guests + 1 > event.available) {
      setSubmitError(`名額不足。剩餘 ${event.available} 個座位，您嘗試預留 ${guests + 1} 個。`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          guests,
          notes: form.notes.trim() || null,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as RegistrationResponse | ApiError;

      if (!res.ok) {
        const err = data as ApiError;
        throw new Error(err.error || '報名失敗');
      }

      setSubmitted(data as RegistrationResponse);
      // Scroll to top so the user sees the confirmation
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Render: loading ----------
  if (!hydrated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-sm">正在讀取活動資訊...</p>
        </div>
      </div>
    );
  }

  // ---------- Render: load error ----------
  if (loadError || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">無法顯示活動</h1>
          <p className="text-sm text-slate-600 mb-6">
            {loadError || '活動不存在或連結已失效。'}
          </p>
          <p className="text-xs text-slate-400">
            如您認為這是錯誤，請聯絡邀請您的工作人員。
          </p>
        </div>
      </div>
    );
  }

  // ---------- Render: success ----------
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50/30 to-slate-100 flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">報名成功</h1>
            <p className="text-sm text-emerald-50">Thank you for your registration, see you soon</p>
          </div>

          {/* Details */}
          <div className="px-8 py-7 space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">活動</p>
              <p className="text-lg font-semibold text-slate-900">{submitted.eventTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 mb-1">姓名</p>
                <p className="text-sm font-medium text-slate-900">{submitted.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">電郵</p>
                <p className="text-sm font-medium text-slate-900 break-all">{submitted.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">同行人數</p>
                <p className="text-sm font-medium text-slate-900">{submitted.guests} 人</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">狀態</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  已確認
                </span>
              </div>
            </div>

            {/* Event info recap */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  {new Date(event.date).toLocaleString('zh-HK', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 pt-3 leading-relaxed">
              請保存此頁面作為報名確認。活動當天請準時到達，並向工作人員出示您註冊時使用的電郵地址。
              如需取消或修改報名資料，請聯絡邀請您的工作人員。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Render: form ----------
  const guests = parseInt(form.guests) || 0;
  const requestedSeats = guests + 1;
  const isFull = event.isFull;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back link */}
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          MCLUB CRM
        </button>

        {/* Event card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Poster image */}
          {event.imageUrl && (
            <div className="w-full h-56 sm:h-64 overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Header */}
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                <Ticket className="h-3 w-3" />
                {TYPE_LABELS[event.type] || event.type}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                接受報名
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {event.title}
            </h1>
            {event.description && (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            )}
          </div>

          {/* Info grid */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50/50 border-b border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">日期時間</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(event.date).toLocaleString('zh-HK', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">地點</p>
                  <p className="text-sm font-medium text-slate-900">{event.location}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">名額</p>
                <p className="text-sm font-medium text-slate-900">
                  <span className={cn(isFull ? 'text-red-600' : 'text-emerald-700')}>
                    {event.available}
                  </span>
                  <span className="text-slate-400"> / {event.maxAttendees} 個座位可用</span>
                </p>
              </div>
            </div>
          </div>

          {/* Full warning */}
          {isFull && (
            <div className="px-6 sm:px-8 py-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">此活動已額滿，無法接受新的報名。</p>
              </div>
            </div>
          )}

          {/* Registration form */}
          {!isFull && (
            <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">報名表格</h2>
                <p className="text-xs text-slate-500">
                  標示 <span className="text-red-500">*</span> 為必填欄位
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="您的姓名"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  電郵地址 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  maxLength={200}
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  用於報名確認及活動通知
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    聯絡電話
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+852 1234 5678"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-slate-700 mb-1.5">
                    同行人數
                  </label>
                  <Input
                    id="guests"
                    type="number"
                    min={0}
                    max={Math.min(20, Math.max(0, event.available - 1))}
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    不包括您自己，最多 {Math.min(20, Math.max(0, event.available - 1))} 人
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">
                  備註
                </label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="特殊需求、飲食偏好或其他想通知主辦方的事項（選填）"
                  rows={3}
                  maxLength={1000}
                  className="resize-none"
                />
              </div>

              {/* Seat summary */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-amber-900">本次將預留座位</span>
                <span className="text-sm font-bold text-amber-900">
                  {requestedSeats} 個（您 + {guests} 位同行）
                </span>
              </div>

              {/* Error */}
              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '確認報名'
                )}
              </Button>

              <p className="text-center text-[11px] text-slate-400 leading-relaxed">
                提交即表示您同意接收此活動的相關通知。
                <br />
                我們不會將您的資料用於其他用途或轉售給第三方。
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} MCLUB. All rights reserved.
        </p>
      </div>
    </div>
  );
}
