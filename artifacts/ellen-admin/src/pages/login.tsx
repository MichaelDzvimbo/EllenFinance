import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminLogin, setAuthTokenGetter } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useAdminLogin();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('admin_token') ?? sessionStorage.getItem('admin_token');
    if (token) setLocation('/dashboard');
  }, [setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Missing credentials', description: 'Please enter both username and password.', variant: 'destructive' });
      return;
    }
    login.mutate(
      { data: { username: username.trim(), password } },
      {
        onSuccess: (data: { token?: string }) => {
          const token = data?.token ?? '';
          if (!token) {
            toast({ title: 'Login error', description: 'No token received from server.', variant: 'destructive' });
            return;
          }
          localStorage.setItem('admin_token', token);
          setAuthTokenGetter(() => localStorage.getItem('admin_token'));
          setLocation('/dashboard');
        },
        onError: (err: { message?: string }) => {
          toast({
            title: 'Login Failed',
            description: err?.message ?? 'Invalid username or password. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="space-y-4 items-center">
          <img src="/admin/logo-login.png" alt="Ellen Finance Logo" className="h-16 object-contain" />
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-serif">Admin Portal</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to access the dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="admin"
                className="bg-background"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="bg-background"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={login.isPending}
            >
              {login.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
