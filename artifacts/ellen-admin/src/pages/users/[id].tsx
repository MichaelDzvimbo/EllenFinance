import React from "react";
import { Link, useLocation } from "wouter";
import { useGetAdminUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User as UserIcon, Phone, Mail, FileText } from "lucide-react";
import { format } from "date-fns";

export default function UserDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetAdminUser(id, { query: { enabled: !!id } });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading user profile...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">User not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-serif font-medium tracking-tight">{user.fullName}</h2>
          <p className="text-muted-foreground">Client ID: #{user.id} • Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card border-border md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><UserIcon className="h-5 w-5 text-primary" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">National ID</p>
              <p className="font-medium">{user.nationalId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium flex items-center gap-2"><Phone className="h-3 w-3" /> {user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium flex items-center gap-2"><Mail className="h-3 w-3" /> {user.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-primary" /> Application History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!user.applications?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No applications found.</TableCell>
                  </TableRow>
                ) : (
                  user.applications.map(app => (
                    <TableRow key={app.id} className="border-border">
                      <TableCell className="font-medium">{app.referenceNumber}</TableCell>
                      <TableCell>{format(new Date(app.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">${app.requestedAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{app.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/applications/${app.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
