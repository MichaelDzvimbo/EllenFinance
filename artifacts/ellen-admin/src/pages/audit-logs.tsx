import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAuditLogs } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ShieldAlert } from "lucide-react";

export default function AuditLogs() {
  const { data: logs, isLoading } = useGetAuditLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-serif font-medium tracking-tight">System Audit Logs</h2>
      </div>
      <p className="text-muted-foreground">Immutable trail of all administrative actions taken on the platform.</p>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading audit trail...</TableCell>
                </TableRow>
              ) : !logs?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit logs recorded.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-medium text-primary">{log.adminUsername}</TableCell>
                    <TableCell>
                      <span className="inline-flex bg-muted/50 px-2 py-1 rounded text-xs uppercase font-semibold">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.entityType} #{log.entityId}
                    </TableCell>
                    <TableCell className="text-sm max-w-md truncate text-muted-foreground">
                      {log.details || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
