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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function getAdminToken(): string | null {
  return localStorage.getItem("admin_token") ?? sessionStorage.getItem("admin_token");
}

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
