'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app';
import { setToken, getToken } from '@/lib/api-helpers';
import { Shield, UserPlus, LogIn } from 'lucide-react';

export function LoginPage() {
  const { setUser, hydrate, user } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'director'>('director');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // On mount, try to restore session from stored token
  useEffect(() => {
    const token = getToken();
    if (token) {
      hydrate();
    }
  }, [hydrate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        const u = data.user || data;
        setUser({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
        });
      } else {
        setError(data.error || '登入失敗');
      }
    } catch {
      setError('網絡錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        const u = data.user || data;
        setUser({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
        });
        setSuccess('註冊成功！正在登入...');
      } else {
        setError(data.error || '註冊失敗');
      }
    } catch {
      setError('網絡錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
    setSuccess('');
    // Reset fields when switching
    if (newMode === 'register') {
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setRole('director');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <Shield className="h-8 w-8 text-amber-700" />
          </div>
          <CardTitle className="text-2xl font-bold">MCLUB CRM</CardTitle>
          <CardDescription>會員俱樂部客戶關係管理系統</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mode Toggle */}
          <div className="mb-6 flex rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="h-4 w-4" />
              登入
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                mode === 'register'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              註冊
            </button>
          </div>

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">電子郵件</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">密碼</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? '登入中...' : '登入'}
              </Button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">姓名 <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="請輸入姓名"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">電子郵件 <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">密碼 <span className="text-red-500">*</span></label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6個字符"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">電話號碼</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+852 9XXX XXXX"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">角色 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('director')}
                    className={`rounded-lg border-2 p-3 text-center transition-all ${
                      role === 'director'
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-gray-200 bg-background hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg font-semibold">總監</div>
                    <div className="text-xs text-muted-foreground">Director</div>
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                {loading ? '註冊中...' : '註冊'}
              </Button>
            </form>
          )}

          

          {mode === 'register' && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              註冊即表示您同意 MCLUB CRM 的使用條款及私隱政策
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
