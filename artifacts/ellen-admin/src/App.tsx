import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect } from "react";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Applications from "@/pages/applications/index";
import ApplicationDetail from "@/pages/applications/[id]";
import Loans from "@/pages/loans/index";
import LoanDetail from "@/pages/loans/[id]";
import Overdues from "@/pages/overdues";
import Documents from "@/pages/documents";
import Notifications from "@/pages/notifications";
import Users from "@/pages/users/index";
import UserDetail from "@/pages/users/[id]";
import AuditLogs from "@/pages/audit-logs";
import LoanOfficers from "@/pages/loan-officers";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

// Wire up admin token on app boot so requests after a page refresh carry auth
setAuthTokenGetter(() => localStorage.getItem("admin_token") ?? sessionStorage.getItem("admin_token"));

function getAdminToken(): string | null {
  return localStorage.getItem("admin_token") ?? sessionStorage.getItem("admin_token");
}

function clearAdminToken(): void {
  localStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_token");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401 — the session is gone; redirect to login instead
        if ((error as { status?: number })?.status === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

// Global 401 handler: clear stored token and navigate to /login when any
// React Query request comes back unauthorised (expired admin session).
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action?.type === "error") {
    const err = event.action.error as { status?: number } | null;
    if (err?.status === 401) {
      clearAdminToken();
      window.location.replace(
        import.meta.env.BASE_URL.replace(/\/$/, "") + "/login",
      );
    }
  }
});

// RequireAuth: all hooks run unconditionally (Rules of Hooks).
// The useEffect redirects unauthenticated users after mount; the synchronous
// null return prevents a flash of protected content on the same render.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const token = getAdminToken();

  useEffect(() => {
    if (!token) {
      setLocation("/login");
    }
  }, [token, setLocation]);

  if (!token) return null;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/dashboard">
        <RequireAuth><Layout><Dashboard /></Layout></RequireAuth>
      </Route>

      <Route path="/applications">
        <RequireAuth><Layout><Applications /></Layout></RequireAuth>
      </Route>
      <Route path="/applications/:id">
        {(params) => <RequireAuth><Layout><ApplicationDetail params={params} /></Layout></RequireAuth>}
      </Route>

      <Route path="/loans">
        <RequireAuth><Layout><Loans /></Layout></RequireAuth>
      </Route>
      <Route path="/loans/:id">
        {(params) => <RequireAuth><Layout><LoanDetail params={params} /></Layout></RequireAuth>}
      </Route>

      <Route path="/overdues">
        <RequireAuth><Layout><Overdues /></Layout></RequireAuth>
      </Route>
      <Route path="/documents">
        <RequireAuth><Layout><Documents /></Layout></RequireAuth>
      </Route>
      <Route path="/notifications">
        <RequireAuth><Layout><Notifications /></Layout></RequireAuth>
      </Route>

      <Route path="/users">
        <RequireAuth><Layout><Users /></Layout></RequireAuth>
      </Route>
      <Route path="/users/:id">
        {(params) => <RequireAuth><Layout><UserDetail params={params} /></Layout></RequireAuth>}
      </Route>

      <Route path="/loan-officers">
        <RequireAuth><Layout><LoanOfficers /></Layout></RequireAuth>
      </Route>
      <Route path="/audit-logs">
        <RequireAuth><Layout><AuditLogs /></Layout></RequireAuth>
      </Route>
      <Route path="/settings">
        <RequireAuth><Layout><Settings /></Layout></RequireAuth>
      </Route>

      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      <Route>
        <RequireAuth><Layout><NotFound /></Layout></RequireAuth>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
