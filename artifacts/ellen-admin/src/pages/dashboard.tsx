import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CreditCard, AlertTriangle, DollarSign } from "lucide-react";
import { useGetAdminDashboard, useGetAdminCharts, useGetAdminActivity } from "@workspace/api-client-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#27a362', '#c9972c', '#e11d48', '#2b4a7a', '#64748b'];

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetAdminDashboard();
  const { data: charts, isLoading: isChartsLoading } = useGetAdminCharts();
  const { data: activities, isLoading: isActivityLoading } = useGetAdminActivity();

  const stats = summary ? [
    { label: "Total Applications", value: summary.totalApplications, icon: FileText, sub: `${summary.pendingApplications} pending` },
    { label: "Active Loans", value: summary.activeLoans, icon: CreditCard, sub: `$${summary.totalOutstanding.toLocaleString()} outstanding` },
    { label: "Overdue Accounts", value: summary.overdueLoans, icon: AlertTriangle, sub: "Requires attention" },
    { label: "Total Disbursed", value: `$${summary.totalDisbursed.toLocaleString()}`, icon: DollarSign, sub: `$${summary.totalCollected.toLocaleString()} collected` },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-medium tracking-tight">Overview</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isSummaryLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-card border-border opacity-50 animate-pulse h-[120px]"></Card>
          ))
        ) : stats.map((stat, i) => (
          <Card key={i} className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${i === 2 && Number(stat.value) > 0 ? 'text-red-500' : 'text-primary'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-sans">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif">Monthly Applications & Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {isChartsLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Loading charts...</div>
            ) : charts?.monthly && charts.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthly}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#0d1b2e', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="disbursed" name="Disbursed ($)" fill="#2b4a7a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected ($)" fill="#27a362" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-md">
                No chart data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif">Loan Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-0">
            {isChartsLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Loading charts...</div>
            ) : charts?.statusBreakdown && charts.statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {charts.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1b2e', borderColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="capitalize text-muted-foreground">{value.replace('_', ' ')}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isActivityLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading activity...</div>
            ) : !activities?.length ? (
              <div className="text-center py-4 text-muted-foreground">No recent activity.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/10">
                  <div className={`h-2 w-2 rounded-full ${
                    act.type === 'application' ? 'bg-blue-500' :
                    act.type === 'loan' ? 'bg-green-500' :
                    act.type === 'payment' ? 'bg-yellow-500' : 'bg-primary'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{act.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {act.applicantName} {act.amount ? ` • $${act.amount.toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(act.createdAt), "MMM d, HH:mm")}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
