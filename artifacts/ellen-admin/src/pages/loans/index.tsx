import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useGetAdminLoans } from "@workspace/api-client-react";
import { Search, Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function Loans() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  
  const { data: loans, isLoading } = useGetAdminLoans({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-600/20 text-green-500 hover:bg-green-600/20 border-green-600/20">Active</Badge>;
      case "overdue": return <Badge variant="destructive" className="bg-red-600/20 text-red-500 hover:bg-red-600/20 border-red-600/20">Overdue</Badge>;
      case "completed": return <Badge variant="outline" className="bg-blue-600/20 text-blue-500 hover:bg-blue-600/20 border-blue-600/20">Completed</Badge>;
      case "defaulted": return <Badge variant="outline" className="bg-gray-600/20 text-gray-500 hover:bg-gray-600/20 border-gray-600/20">Defaulted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-medium tracking-tight">Active Loans</h2>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Loan Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search borrower or loan ID..."
                className="pl-9 bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading loans...</TableCell>
                  </TableRow>
                ) : !loans?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No loans found</TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => (
                    <TableRow key={loan.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium">#{loan.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{loan.applicantName || `App #${loan.applicationId}`}</span>
                          <span className="text-xs text-muted-foreground">{loan.applicantPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${loan.principalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        ${loan.outstandingBalance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {loan.nextDueDate ? (
                          <div className={`flex items-center gap-1 ${new Date(loan.nextDueDate) < new Date() ? 'text-red-500' : ''}`}>
                            {new Date(loan.nextDueDate) < new Date() && <AlertCircle className="h-3 w-3" />}
                            {format(new Date(loan.nextDueDate), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(loan.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/loans/${loan.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open</span>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
