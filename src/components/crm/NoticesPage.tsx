'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { fetchWithAuth } from '@/lib/api-helpers';
import { useAppStore } from '@/store/app';
import {
  Plus,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Megaphone,
  AlertTriangle,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  targetRoles: string;
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  announcement: '公告',
  urgent: '緊急',
  policy: '政策',
};

const CATEGORY_COLORS: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-800',
  urgent: 'bg-red-100 text-red-800',
  policy: 'bg-amber-100 text-amber-800',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  announcement: <Megaphone className="h-4 w-4" />,
  urgent: <AlertTriangle className="h-4 w-4" />,
  policy: <ShieldCheck className="h-4 w-4" />,
};

const ROLE_LABELS: Record<string, string> = {
  admin: '管理員',
  sme: 'SME負責人',
  agent: '代理',
  client: '客戶',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  sme: 'bg-teal-100 text-teal-800',
  agent: 'bg-green-100 text-green-800',
  client: 'bg-orange-100 text-orange-800',
};

const ALL_ROLES = ['admin', 'sme', 'agent', 'client'];

const emptyForm = {
  title: '',
  content: '',
  category: 'announcement',
  targetRoles: ['admin', 'sme', 'agent', 'client'] as string[],
};

export function NoticesPage() {
  const { user } = useAppStore();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const fetchNotices = () => {
    fetchWithAuth(`/api/notices?role=${user?.role || ''}`).then((d) => {
      setNotices(d);
    });
  };

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/api/notices?role=${user?.role || ''}`).then((d) => {
      if (!cancelled) setNotices(d);
    });
    return () => { cancelled = true; };
  }, [user]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditId(notice.id);
    setForm({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      targetRoles: notice.targetRoles.split(','),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return;

    const targetRolesStr = form.targetRoles.join(',');

    if (editId) {
      // Update existing notice
      await fetchWithAuth('/api/notices', {
        method: 'PATCH',
        body: JSON.stringify({
          id: editId,
          authorId: user?.id,
          title: form.title,
          content: form.content,
          category: form.category,
          targetRoles: targetRolesStr,
        }),
      });
    } else {
      // Create new notice
      await fetchWithAuth('/api/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          category: form.category,
          targetRoles: targetRolesStr,
          authorId: user?.id,
        }),
      });
    }
    setOpen(false);
    setEditId(null);
    setForm({ ...emptyForm });
    fetchNotices();
  };

  const togglePin = async (notice: Notice) => {
    await fetchWithAuth('/api/notices', {
      method: 'PATCH',
      body: JSON.stringify({
        id: notice.id,
        authorId: user?.id,
        isPinned: !notice.isPinned,
      }),
    });
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    await fetchWithAuth(`/api/notices?id=${id}&authorId=${user?.id}`, {
      method: 'DELETE',
    });
    fetchNotices();
  };

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📢 群組公告</h1>
          <p className="text-muted-foreground">
            {isAdmin ? '管理及發佈系統公告' : '查看最新公告及通知'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                新增公告
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editId ? '編輯公告' : '新增公告'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">標題 *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="公告標題"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">內容 *</label>
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="公告內容..."
                    rows={5}
                    className="resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">分類</label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">📢 公告</SelectItem>
                      <SelectItem value="urgent">🚨 緊急</SelectItem>
                      <SelectItem value="policy">📜 政策</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">目標角色</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {ALL_ROLES.map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={form.targetRoles.includes(role)}
                          onCheckedChange={() => toggleRole(role)}
                        />
                        <span className="text-sm">{ROLE_LABELS[role]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  disabled={!form.title || !form.content || form.targetRoles.length === 0}
                >
                  {editId ? '確認更新' : '確認發佈'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Notice list */}
      <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
        {notices.map((notice) => {
          const isExpanded = expandedId === notice.id;
          return (
            <Card
              key={notice.id}
              className={cn(
                'transition-all hover:shadow-sm',
                notice.isPinned && 'border-l-4 border-l-amber-500',
                notice.category === 'urgent' && !notice.isPinned && 'border-l-4 border-l-red-500'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.isPinned && (
                        <Pin className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <h3
                        className={cn(
                          'text-sm font-semibold cursor-pointer',
                          !isExpanded && 'truncate'
                        )}
                        onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                      >
                        {notice.title}
                      </h3>
                    </div>

                    {/* Badges row */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', CATEGORY_COLORS[notice.category])}
                      >
                        {CATEGORY_ICONS[notice.category]}
                        <span className="ml-1">{CATEGORY_LABELS[notice.category]}</span>
                      </Badge>
                      {notice.targetRoles.split(',').map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={cn('text-[10px]', ROLE_COLORS[role])}
                        >
                          {ROLE_LABELS[role] || role}
                        </Badge>
                      ))}
                    </div>

                    {/* Content (expanded) */}
                    {isExpanded && (
                      <div className="mt-3 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {notice.content}
                        </p>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {notice.author.name} · {ROLE_LABELS[notice.author.role] || notice.author.role}
                      </span>
                      <span>·</span>
                      <span>{new Date(notice.createdAt).toLocaleString('zh-HK')}</span>
                      {!isExpanded && (
                        <button
                          className="text-amber-600 hover:underline"
                          onClick={() => setExpandedId(notice.id)}
                        >
                          展開
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions (admin only) */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePin(notice)}
                        title={notice.isPinned ? '取消置頂' : '置頂'}
                      >
                        {notice.isPinned ? (
                          <PinOff className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(notice)}
                        title="編輯"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(notice.id)}
                        title="刪除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Non-admin: expand/collapse */}
                  {!isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                      title={isExpanded ? '收起' : '展開'}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {notices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Megaphone className="h-12 w-12 mb-4 opacity-20" />
            <p>暫無公告</p>
            <p className="text-sm mt-1">目前沒有相關公告通知</p>
          </div>
        )}
      </div>
    </div>
  );
}
