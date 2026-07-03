'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchWithAuth } from '@/lib/api-helpers';
import { useAppStore } from '@/store/app';
import {
  Search,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  UserPlus,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: '管理員',
  director: '總監',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  director: 'bg-blue-100 text-blue-800 border-blue-200',
};

interface UserItem {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  _count?: {
    orders: number;
    commissions: number;
    referrals: number;
  };
}

export function UsersPage() {
  const { user: currentUser } = useAppStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [roleCounts, setRoleCounts] = useState({ admins: 0, directors: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addError, setAddError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) params.set('search', search);
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetchWithAuth(`/api/users?${params}`);
      setUsers(res.data || []);
      setTotal(res.total || 0);

      // Fetch role counts separately for accurate stats
      const [adminRes, directorRes] = await Promise.all([
        fetchWithAuth('/api/users?role=admin&pageSize=1'),
        fetchWithAuth('/api/users?role=director&pageSize=1'),
      ]);
      setRoleCounts({
        admins: adminRes.total || 0,
        directors: directorRes.total || 0,
      });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = Math.ceil(total / pageSize);

  const openDetail = (u: UserItem) => {
    setSelectedUser(u);
    setDetailOpen(true);
  };

  const openEdit = (u: UserItem) => {
    setSelectedUser(u);
    setEditName(u.name);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setActionError('');
    setEditOpen(true);
  };

  const openDelete = (u: UserItem) => {
    setSelectedUser(u);
    setActionError('');
    setDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setActionError('');
    try {
      await fetchWithAuth(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, phone: editPhone, role: editRole }),
      });
      setEditOpen(false);
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message || '更新失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setActionError('');
    try {
      await fetchWithAuth(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      setDeleteOpen(false);
      fetchUsers();
    } catch (e: any) {
      setActionError(e.message || '刪除失敗');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const stats = {
    total: total,
    admins: roleCounts.admins,
    directors: roleCounts.directors,
  };

  const handleAddDirector = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      setAddError('請填寫所有必填欄位');
      return;
    }
    if (addPassword.length < 6) {
      setAddError('密碼至少需要6個字符');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await fetchWithAuth('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          password: addPassword,
          phone: addPhone || undefined,
          role: 'director',
        }),
      });
      setAddOpen(false);
      fetchUsers();
    } catch (e: any) {
      setAddError(e.message || '建立失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用戶管理</h1>
          <p className="text-muted-foreground">管理系統用戶及總監帳號</p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => { setAddName(''); setAddEmail(''); setAddPhone(''); setAddPassword(''); setAddError(''); setAddOpen(true); }}>
            <UserPlus className="mr-2 h-4 w-4" />
            新增總監
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <UserCog className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">總用戶數</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Shield className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">管理員</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <UserCheck className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.directors}</p>
              <p className="text-xs text-muted-foreground">總監</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋姓名、電郵或電話..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="所有角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有角色</SelectItem>
            <SelectItem value="admin">管理員</SelectItem>
            <SelectItem value="director">總監</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">用戶列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserCog className="mb-2 h-10 w-10" />
              <p>沒有找到用戶</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">用戶</th>
                      <th className="pb-3 pr-4 font-medium">電子郵件</th>
                      <th className="pb-3 pr-4 font-medium">電話</th>
                      <th className="pb-3 pr-4 font-medium">角色</th>
                      <th className="pb-3 pr-4 font-medium">訂單</th>
                      <th className="pb-3 pr-4 font-medium">佣金</th>
                      <th className="pb-3 pr-4 font-medium">推薦客戶</th>
                      <th className="pb-3 pr-4 font-medium">註冊日期</th>
                      <th className="pb-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium">{u.name}</span>
                            {u.id === currentUser?.id && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50">
                                自己
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{u.phone || '-'}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className={`text-xs ${ROLE_COLORS[u.role] || ''}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{u._count?.orders ?? '-'}</td>
                        <td className="py-3 pr-4">{u._count?.commissions ?? '-'}</td>
                        <td className="py-3 pr-4">{u._count?.referrals ?? '-'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="查看" onClick={() => openDetail(u)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {u.id !== currentUser?.id && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="編輯" onClick={() => openEdit(u)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" title="刪除" onClick={() => openDelete(u)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    共 {total} 個用戶，第 {page}/{totalPages} 頁
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>用戶詳情</DialogTitle>
            <DialogDescription>查看用戶的詳細資訊</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-xl">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <Badge variant="outline" className={`text-xs ${ROLE_COLORS[selectedUser.role] || ''}`}>
                    {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.phone || '未設定'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>註冊日期：{formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted p-3 text-center">
                <div>
                  <p className="text-xl font-bold">{selectedUser._count?.orders ?? 0}</p>
                  <p className="text-xs text-muted-foreground">訂單數</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedUser._count?.commissions ?? 0}</p>
                  <p className="text-xs text-muted-foreground">佣金筆數</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedUser._count?.referrals ?? 0}</p>
                  <p className="text-xs text-muted-foreground">推薦客戶</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) setActionError(''); setEditOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯用戶</DialogTitle>
            <DialogDescription>修改用戶資料及角色</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">姓名</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">電話</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+852 9XXX XXXX" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">角色</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理員</SelectItem>
                    <SelectItem value="director">總監</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {actionError && <p className="text-sm text-red-500">{actionError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>取消</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSaveEdit} disabled={saving}>
              {saving ? '儲存中...' : '儲存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v) setActionError(''); setDeleteOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>此操作無法撤銷</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <p className="text-sm">
                確定要刪除用戶 <strong>{selectedUser.name}</strong> ({selectedUser.email}) 嗎？
              </p>
              <p className="text-sm text-muted-foreground">
                該用戶的相關訂單、佣金及推薦記錄將受到影響。
              </p>
              {actionError && <p className="text-sm text-red-500">{actionError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? '刪除中...' : '確認刪除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Director Dialog */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) { setAddName(''); setAddEmail(''); setAddPhone(''); setAddPassword(''); setAddError(''); } setAddOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增總監</DialogTitle>
            <DialogDescription>建立新的總監帳號，總監可引入客戶並管理其訂單</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名 *</label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="請輸入姓名" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">電子郵件 *</label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="director@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密碼 *</label>
              <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="至少6個字符" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">電話</label>
              <Input value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="+852 9XXX XXXX" />
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-800">
                <strong>角色：</strong>總監 — 總監可引入客戶、管理訂單及查看佣金
              </p>
            </div>
            {addError && <p className="text-sm text-red-500">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>取消</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAddDirector} disabled={saving}>
              {saving ? '建立中...' : '建立總監'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
