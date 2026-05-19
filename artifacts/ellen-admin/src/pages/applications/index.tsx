import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useGetAdminApplications } from "@workspace/api-client-react";
import { Search, Eye } from "lucide-react";
import { format } from "date-fns";

export default function Applications() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  
  const { data, isLoading } = useGetAdminApplications({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-600/20 text-green-500 hover:bg-green-600/20 border-green-600/20">Approved</Badge>;
      case "rejected": return <Badge variant="destructive" className="bg-red-600/20 text-red-500 hover:bg-red-600/20 border-red-600/20">Rejected</Badge>;
      case "pending": return <Badge variant="outline" className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/20 border-yellow-600/20">Pending</Badge>;
      case "under_review": return <Badge variant="outline" className="bg-blue-600/20 text-blue-500 hover:bg-blue-600/20 border-blue-600/20">Under Review</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-medium tracking-tight">Applications</h2>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or ref..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Reference</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading applications...</TableCell>
                  </TableRow>
                ) : !data?.items?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No applications found</TableCell>
                  </TableRow>
                ) : (
                  data.items.map((app) => (
                    <TableRow key={app.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium text-primary">{app.referenceNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{app.fullName}</span>
                          <span className="text-xs text-muted-foreground">{app.nationalId}</span>
                        </div>
                      </TableCell>
                      <TableCell>${app.requestedAmount.toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(app.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/applications/${app.id}`}>
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
