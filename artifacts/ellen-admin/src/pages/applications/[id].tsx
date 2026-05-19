import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  useGetAdminApplication, 
  useUpdateAdminApplication, 
  getGetAdminApplicationQueryKey,
  useGetAdminDocuments,
  useUpdateAdminDocument
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, FileText, Send, User, MapPin, Briefcase, Phone, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function ApplicationDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useGetAdminApplication(id, { query: { enabled: !!id } });
  const { data: documents } = useGetAdminDocuments({ applicationId: id }, { query: { enabled: !!id } });
  
  const updateApp = useUpdateAdminApplication();
  const updateDoc = useUpdateAdminDocument();

  const [notes, setNotes] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const handleUpdateStatus = (status: string) => {
    updateApp.mutate({
      id,
      data: {
        status,
        adminNotes: notes,
        approvedAmount: status === "approved" ? Number(approvedAmount) || app?.requestedAmount : undefined,
        sendSms: true
      }
    }, {
      onSuccess: () => {
        toast({ title: `Application ${status}`, description: `The application has been marked as ${status}.` });
        queryClient.invalidateQueries({ queryKey: getGetAdminApplicationQueryKey(id) });
        setIsApproving(false);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to update application", variant: "destructive" });
      }
    });
  };

  const handleUpdateDocStatus = (docId: number, status: string) => {
    updateDoc.mutate({
      id: docId,
      data: { status }
    }, {
      onSuccess: () => {
        toast({ title: "Document Updated", description: `Document status changed to ${status}.` });
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading application details...</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-red-500">Application not found</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/applications")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-serif font-medium tracking-tight">Application #{app.referenceNumber}</h2>
            <Badge variant="outline" className="capitalize">{app.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-muted-foreground">Submitted on {format(new Date(app.createdAt), "PPP p")}</p>
        </div>
        
        {app.status === "pending" || app.status === "under_review" ? (
          <div className="flex gap-2">
            <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={() => handleUpdateStatus("rejected")}>
              <XCircle className="w-4 h-4 mr-2" /> Reject
            </Button>
            
            <Dialog open={isApproving} onOpenChange={setIsApproving}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Approve Application</DialogTitle>
                  <DialogDescription>
                    Confirm the final approved amount and add internal notes. The client will be notified.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Approved Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      defaultValue={app.requestedAmount}
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Admin Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Internal reasoning for approval..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsApproving(false)}>Cancel</Button>
                  <Button onClick={() => handleUpdateStatus("approved")} className="bg-green-600 hover:bg-green-700">Confirm Approval</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : null}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> Applicant Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{app.fullName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">National ID</p>
                <p className="font-medium">{app.nationalId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2"><Mail className="h-3 w-3" /> {app.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-2"><Phone className="h-3 w-3" /> {app.phone}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-1" /> {app.address}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-primary" /> Financial Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <p className="font-medium capitalize">{app.employmentType.replace("_", " ")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employer</p>
                <p className="font-medium">{app.employer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="font-medium">${app.monthlyIncome.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-primary" /> KYC Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {!documents || documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded.</p>
              ) : (
                <div className="space-y-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.docType.replace("_", " ").toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'outline'}>
                          {doc.status}
                        </Badge>
                        {doc.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-green-500 hover:text-green-400 hover:bg-green-500/10" onClick={() => handleUpdateDocStatus(doc.id, "approved")}>Approve</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleUpdateDocStatus(doc.id, "rejected")}>Reject</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Loan Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm text-primary/80 uppercase tracking-wider font-semibold mb-1">Requested Amount</p>
                <p className="text-4xl font-serif text-primary">${app.requestedAmount.toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium">{app.repaymentMonths} months</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Payout Method</span>
                <span className="font-medium uppercase">{app.payoutMethod}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Add notes about this application..." 
                className="bg-background min-h-[120px] mb-4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button className="w-full" variant="secondary" onClick={() => handleUpdateStatus(app.status)}>
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
