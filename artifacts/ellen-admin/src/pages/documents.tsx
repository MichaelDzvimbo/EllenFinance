import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAdminDocuments, useUpdateAdminDocument } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, Download, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Documents() {
  const [status, setStatus] = useState<string>("pending");
  const { data: documents, isLoading } = useGetAdminDocuments({ status: status !== "all" ? status : undefined });
  
  const updateDoc = useUpdateAdminDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUpdateStatus = (id: number, newStatus: string) => {
    updateDoc.mutate({
      id,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        toast({ title: "Updated", description: `Document status changed to ${newStatus}.` });
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-medium tracking-tight">KYC Verification</h2>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            <SelectItem value="pending">Needs Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Document Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>App ID</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading documents...</TableCell>
                </TableRow>
              ) : !documents?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No documents found matching filter.</TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {doc.docType.replace("_", " ").toUpperCase()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.fileName}</TableCell>
                    <TableCell>#{doc.applicationId}</TableCell>
                    <TableCell>{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'outline'}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      {doc.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleUpdateStatus(doc.id, "approved")}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleUpdateStatus(doc.id, "rejected")}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
