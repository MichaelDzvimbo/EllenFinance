import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGetAdminNotifications, useSendNotification } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, Send, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { data: notifications, isLoading } = useGetAdminNotifications();
  const sendNotification = useSendNotification();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    sendNotification.mutate({
      data: {
        userId: 0, // Mock generic send without user ID
        channel: "sms",
        message,
        recipientPhone: phone,
        type: "manual"
      } as any // Cast since backend might require specific types
    }, {
      onSuccess: () => {
        toast({ title: "Sent", description: "Notification dispatched." });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        setIsOpen(false);
        setMessage("");
        setPhone("");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-medium tracking-tight">Communications Log</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="h-4 w-4 mr-2" /> Send SMS
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Send SMS Message</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Recipient Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+263..." className="bg-background" />
              </div>
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type message here..." className="bg-background" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSend} className="bg-primary hover:bg-primary/90">Send Now</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading log...</TableCell>
                </TableRow>
              ) : !notifications?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No notifications sent yet.</TableCell>
                </TableRow>
              ) : (
                notifications.map((note) => (
                  <TableRow key={note.id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      {note.type === 'sms' ? <Smartphone className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-medium">{note.recipientPhone}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground" title={note.message}>
                      {note.message}
                    </TableCell>
                    <TableCell>{format(new Date(note.createdAt), "MMM d, HH:mm")}</TableCell>
                    <TableCell>
                      <Badge variant={note.status === 'sent' || note.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                        {note.status}
                      </Badge>
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
