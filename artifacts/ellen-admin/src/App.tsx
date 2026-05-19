import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

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
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/dashboard"><Layout><Dashboard /></Layout></Route>
      
      <Route path="/applications"><Layout><Applications /></Layout></Route>
      <Route path="/applications/:id">{(params) => <Layout><ApplicationDetail params={params} /></Layout>}</Route>
      
      <Route path="/loans"><Layout><Loans /></Layout></Route>
      <Route path="/loans/:id">{(params) => <Layout><LoanDetail params={params} /></Layout>}</Route>
      
      <Route path="/overdues"><Layout><Overdues /></Layout></Route>
      <Route path="/documents"><Layout><Documents /></Layout></Route>
      <Route path="/notifications"><Layout><Notifications /></Layout></Route>
      
      <Route path="/users"><Layout><Users /></Layout></Route>
      <Route path="/users/:id">{(params) => <Layout><UserDetail params={params} /></Layout>}</Route>
      
      <Route path="/audit-logs"><Layout><AuditLogs /></Layout></Route>
      <Route path="/settings"><Layout><Settings /></Layout></Route>
      
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Set dark class globally to enforce dark cockpit vibe */}
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
