import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useGetAdminOverdues } from "@workspace/api-client-react";
import { Link } from "wouter";
import { AlertTriangle, Phone, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function Overdues() {
  const { data: overdues, isLoading } = useGetAdminOverdues();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-medium tracking-tight text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Overdue Loans
          </h2>
          <p className="text-muted-foreground mt-1">Accounts requiring immediate collection action.</p>
        </div>
        <Button variant="outline" className="border-border">
          <MessageSquare className="h-4 w-4 mr-2" /> Bulk SMS Reminder
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Borrower</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading overdues...</TableCell>
                </TableRow>
              ) : !overdues?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No overdue loans! Good job.</TableCell>
                </TableRow>
              ) : (
                overdues.map((loan) => (
                  <TableRow key={loan.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium">{loan.applicantName ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {loan.applicantPhone ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-500">
                      ${loan.outstandingBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                        {loan.daysOverdue} days
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loan.nextDueDate ? format(new Date(loan.nextDueDate), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="secondary" size="sm">Manage Loan</Button>
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
  );
}
