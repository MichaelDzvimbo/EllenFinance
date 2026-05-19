import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, CreditCard, AlertTriangle, FileBox, Bell, Users, Settings, Activity, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetAdminMe, useAdminLogout } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: admin, isLoading, error } = useGetAdminMe({ query: { retry: false } });
  const logout = useAdminLogout();

  // Redirect to login if unauthenticated
  React.useEffect(() => {
    if (!isLoading && (error || !admin)) {
      setLocation("/login");
    }
  }, [admin, error, isLoading, setLocation]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login")
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/applications", label: "Applications", icon: FileText },
    { href: "/loans", label: "Loans", icon: CreditCard },
    { href: "/overdues", label: "Overdues", icon: AlertTriangle },
    { href: "/documents", label: "Documents", icon: FileBox },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/users", label: "Users", icon: Users },
    { href: "/audit-logs", label: "Audit Logs", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading workspace...</div>;
  }

  if (!admin) return null; // Will redirect via useEffect

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <img src="/admin/logo-nav.png" alt="Ellen Finance" className="h-8 object-contain" />
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-16 border-b border-border bg-card/50 px-8 flex items-center justify-between">
          <h1 className="text-xl font-serif font-medium">Ellen Finance Admin</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {admin.username.substring(0, 2)}
            </span>
            {admin.fullName || admin.username}
          </div>
        </header>
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
