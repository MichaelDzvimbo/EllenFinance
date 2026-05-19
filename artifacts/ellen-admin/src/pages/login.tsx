import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useAdminLogin();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({
      data: { username, password }
    }, {
      onSuccess: () => {
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Login Failed",
          description: err.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    });
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="admin" 
                className="bg-background" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="bg-background" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
