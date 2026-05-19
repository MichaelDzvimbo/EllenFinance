import React, { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetAdminUsers } from "@workspace/api-client-react";
import { Search, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function Users() {
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useGetAdminUsers({ search: search || undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-medium tracking-tight">Client Directory</h2>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID or phone..."
              className="pl-9 bg-background border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Applications</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
                  </TableRow>
                ) : !users?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium text-primary">{user.fullName}</TableCell>
                      <TableCell>{user.nationalId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{user.phone}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center bg-muted/50 px-2 py-1 rounded-full text-xs font-medium">
                          {user.applicationCount || 0}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), "MMM yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/users/${user.id}`}>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
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
