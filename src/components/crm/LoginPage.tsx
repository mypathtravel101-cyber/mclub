'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/app';
import { Shield } from 'lucide-react';

export function LoginPage() {
  const { setUser } = useAppStore();
  const [email, setEmail] = useState('admin@mclub.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        setError(data.error || '登入失敗');
      }
    } catch {
      setError('網絡錯誤');
    } finally {
      setLoading(false);
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">電子郵件</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mclub.com"
                required
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
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
              {loading ? '登入中...' : '登入'}
            </Button>
          </form>
          <div className="mt-6 space-y-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium">快速登入帳號：</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('admin@mclub.com'); setPassword('admin123'); }}
                className="rounded border bg-background p-2 text-left hover:bg-accent"
              >
                <div className="font-medium">Admin</div>
                <div className="text-muted-foreground">admin@mclub.com</div>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('chan@mypath.hk'); setPassword('agent123'); }}
                className="rounded border bg-background p-2 text-left hover:bg-accent"
              >
                <div className="font-medium">Agent</div>
                <div className="text-muted-foreground">chan@mypath.hk</div>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('wong@mypath.hk'); setPassword('sme123'); }}
                className="rounded border bg-background p-2 text-left hover:bg-accent"
              >
                <div className="font-medium">SME</div>
                <div className="text-muted-foreground">wong@mypath.hk</div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
