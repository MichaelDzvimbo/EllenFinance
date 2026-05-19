import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Clock, CheckCircle, XCircle, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { useTrackApplication, getTrackApplicationQueryKey } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; label: string; desc: string }> = {
  pending: { icon: Clock, color: "text-amber-500 bg-amber-50", label: "Pending Review", desc: "Your application is in the queue for review by our team." },
  under_review: { icon: AlertCircle, color: "text-blue-500 bg-blue-50", label: "Under Review", desc: "Our team is currently reviewing your application and documents." },
  approved: { icon: CheckCircle, color: "text-[#27a362] bg-[#27a362]/10", label: "Approved", desc: "Congratulations! Your loan has been approved." },
  rejected: { icon: XCircle, color: "text-red-500 bg-red-50", label: "Not Approved", desc: "Unfortunately your application was not approved at this time." },
};

export default function Status() {
  const [searchEmail, setSearchEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<{ email: string }>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { data, isFetching } = useTrackApplication(
    { email: searchEmail ?? "" },
    { query: { enabled: !!searchEmail, queryKey: getTrackApplicationQueryKey({ email: searchEmail ?? "" }) } }
  );

  function onSubmit({ email }: { email: string }) {
    setSearchEmail(email);
    queryClient.invalidateQueries({ queryKey: getTrackApplicationQueryKey({ email }) });
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-4">Track Your Application</h1>
          <p className="text-muted-foreground text-lg">Enter the email address you used when applying to check your status.</p>
        </div>

        <div className="bg-white rounded-2xl border p-8 shadow-sm mb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" data-testid="input-track-email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={isFetching} className="bg-[#2b4a7a] hover:bg-[#1e3560] text-white px-6" data-testid="button-track">
                <Search size={18} className="mr-2" />
                {isFetching ? "Searching..." : "Track"}
              </Button>
            </form>
          </Form>
        </div>

        {data && !data.found && (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4" size={40} />
            <h3 className="font-serif text-xl font-bold text-[#2b4a7a] mb-2">No applications found</h3>
            <p className="text-muted-foreground">We couldn't find any applications for <strong>{searchEmail}</strong>. Please check the email address or <a href="/apply" className="text-[#2b4a7a] underline">apply now</a>.</p>
          </div>
        )}

        {data?.found && data.applications && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Found {data.applications.length} application{data.applications.length !== 1 ? "s" : ""} for <strong>{searchEmail}</strong></p>
            {data.applications.map((app) => {
              const statusCfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
              const Icon = statusCfg.icon;
              return (
                <div key={app.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-6 border-b">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reference Number</p>
                        <p className="font-mono font-bold text-[#2b4a7a] text-lg">{app.referenceNumber}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusCfg.color}`}>
                        <Icon size={16} />
                        <span className="font-semibold text-sm">{statusCfg.label}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{statusCfg.desc}</p>
                    {app.adminNotes && (
                      <div className="mt-4 bg-[#f5f0e8] rounded-xl px-4 py-3 text-sm">
                        <span className="font-semibold text-[#2b4a7a]">Note from our team: </span>
                        <span className="text-foreground/80">{app.adminNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Requested</p>
                      <p className="font-bold text-[#2b4a7a]">${app.requestedAmount.toLocaleString()}</p>
                    </div>
                    {app.approvedAmount && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Approved</p>
                        <p className="font-bold text-[#27a362]">${app.approvedAmount.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Term</p>
                      <p className="font-bold text-[#2b4a7a]">{app.repaymentMonths} months</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Applied</p>
                      <p className="text-sm text-foreground/70">{new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Updated</p>
                      <p className="text-sm text-foreground/70">{new Date(app.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>

                  {/* Loan active info */}
                  {app.loanStatus && (
                    <div className="px-6 pb-6">
                      <div className="bg-[#2b4a7a]/5 rounded-xl p-4 border border-[#2b4a7a]/10">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="text-[#2b4a7a]" size={18} />
                          <span className="font-semibold text-[#2b4a7a]">Active Loan</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {app.loanOutstanding != null && (
                            <div><p className="text-xs text-muted-foreground mb-1">Outstanding</p><p className="font-bold text-[#2b4a7a]">${app.loanOutstanding.toLocaleString()}</p></div>
                          )}
                          {app.loanTotalPaid != null && (
                            <div><p className="text-xs text-muted-foreground mb-1">Total Paid</p><p className="font-bold text-[#27a362]">${app.loanTotalPaid.toLocaleString()}</p></div>
                          )}
                          {app.loanNextDue && (
                            <div><p className="text-xs text-muted-foreground mb-1">Next Due</p><p className="font-bold text-[#2b4a7a]">{new Date(app.loanNextDue).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {app.documents && app.documents.length > 0 && (
                    <div className="px-6 pb-6">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Documents ({app.documents.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {app.documents.map((doc) => (
                          <div key={doc.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${doc.status === "approved" ? "bg-[#27a362]/10 text-[#27a362] border-[#27a362]/20" : doc.status === "rejected" ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                            <FileText size={12} />
                            {doc.docType.replace(/_/g, " ")} — {doc.status}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-[#2b4a7a]/5 rounded-2xl p-8 border border-[#2b4a7a]/10 text-center">
          <p className="text-muted-foreground mb-4">Haven't applied yet?</p>
          <a href="/apply" className="inline-flex items-center gap-2 bg-[#2b4a7a] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#1e3560] transition-colors">
            Start Your Application
          </a>
        </div>
      </div>
    </div>
  );
}
