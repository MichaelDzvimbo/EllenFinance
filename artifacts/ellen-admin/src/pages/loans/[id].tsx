import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  useGetAdminLoan,
  useRecordRepayment,
  useAddLoanPenalty,
  getGetAdminLoanQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, DollarSign, Calendar, AlertTriangle, MessageSquare } from "lucide-react";

export default function LoanDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loan, isLoading } = useGetAdminLoan(id, { query: { enabled: !!id } });
  
  const recordRepayment = useRecordRepayment();
  const addPenalty = useAddLoanPenalty();

  // Repayment form state
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState("ecocash");
  const [repayRef, setRepayRef] = useState("");
  const [isRepayOpen, setIsRepayOpen] = useState(false);

  // Penalty form state
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [isPenaltyOpen, setIsPenaltyOpen] = useState(false);

  const handleRecordRepayment = () => {
    recordRepayment.mutate({
      id,
      data: {
        amount: Number(repayAmount),
        paymentMethod: repayMethod,
        referenceNumber: repayRef
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Repayment recorded successfully." });
        queryClient.invalidateQueries({ queryKey: getGetAdminLoanQueryKey(id) });
        setIsRepayOpen(false);
        setRepayAmount("");
        setRepayRef("");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleAddPenalty = () => {
    addPenalty.mutate({
      id,
      data: {
        amount: Number(penaltyAmount),
        reason: penaltyReason
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Penalty added successfully." });
        queryClient.invalidateQueries({ queryKey: getGetAdminLoanQueryKey(id) });
        setIsPenaltyOpen(false);
        setPenaltyAmount("");
        setPenaltyReason("");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading loan details...</div>;
  if (!loan) return <div className="p-8 text-center text-red-500">Loan not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/loans")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-serif font-medium tracking-tight">Loan #{loan.id}</h2>
              <Badge variant={loan.status === 'active' ? 'default' : loan.status === 'overdue' ? 'destructive' : 'outline'} className="capitalize">
                {loan.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{loan.applicantName} • {loan.applicantPhone}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isPenaltyOpen} onOpenChange={setIsPenaltyOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                <AlertTriangle className="w-4 h-4 mr-2" /> Add Penalty
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add Penalty</DialogTitle>
                <DialogDescription>Add a late fee or penalty to the outstanding balance.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Amount ($)</Label>
                  <Input type="number" value={penaltyAmount} onChange={e => setPenaltyAmount(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label>Reason</Label>
                  <Input value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} className="bg-background" placeholder="e.g. Late payment fee" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPenaltyOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleAddPenalty}>Apply Penalty</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRepayOpen} onOpenChange={setIsRepayOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <DollarSign className="w-4 h-4 mr-2" /> Record Repayment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle>Record Repayment</DialogTitle>
                <DialogDescription>Log a manual repayment received from the client.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Amount Received ($)</Label>
                  <Input type="number" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} className="bg-background" />
                </div>
                <div className="grid gap-2">
                  <Label>Payment Method</Label>
                  <Select value={repayMethod} onValueChange={setRepayMethod}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecocash">EcoCash</SelectItem>
                      <SelectItem value="innbucks">InnBucks</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Reference Number</Label>
                  <Input value={repayRef} onChange={e => setRepayRef(e.target.value)} className="bg-background" placeholder="Transaction ID" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRepayOpen(false)}>Cancel</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={handleRecordRepayment}>Save Repayment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Principal Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${loan.principalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${loan.outstandingBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${loan.totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${loan.nextDueDate && new Date(loan.nextDueDate) < new Date() ? 'text-red-500' : ''}`}>
              {loan.nextDueDate ? format(new Date(loan.nextDueDate), "MMM d, yyyy") : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Repayment History</CardTitle>
          </CardHeader>
          <CardContent>
            {!loan.repayments?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No repayments recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {loan.repayments.map(rep => (
                  <div key={rep.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <div>
                      <p className="font-medium text-green-500">+${rep.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{rep.paymentMethod.replace('_', ' ')} • {rep.reference}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {format(new Date(rep.paidAt), "MMM d, p")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Penalties & Fees</CardTitle>
          </CardHeader>
          <CardContent>
            {!loan.penalties?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No penalties applied.</p>
            ) : (
              <div className="space-y-4">
                {loan.penalties.map(pen => (
                  <div key={pen.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-destructive/10">
                    <div>
                      <p className="font-medium text-red-500">${pen.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{pen.reason}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {format(new Date(pen.createdAt), "MMM d")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
