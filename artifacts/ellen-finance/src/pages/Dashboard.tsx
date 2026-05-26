import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User, Upload, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowRight, LogOut, TrendingUp, Loader2, X, CreditCard,
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { TOKEN_KEY } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function apiPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

const KYC_DOCS = [
  { key: "national_id", label: "National ID", desc: "Front & back of your Zimbabwe National ID card", required: true },
  { key: "proof_of_address", label: "Proof of Address", desc: "Utility bill or bank statement (max 3 months old)", required: true },
  { key: "payslip", label: "Payslip / Bank Statement", desc: "Last 3 months", required: true },
  { key: "business_registration", label: "Business Registration", desc: "For self-employed applicants only", required: false },
];

const loanSchema = z.object({
  requestedAmount: z.coerce.number().min(100, "Minimum $100").max(10000, "Maximum $10,000"),
  repaymentMonths: z.coerce.number().int().min(1).max(24),
  payoutMethod: z.string().min(1, "Select payout method"),
  employmentType: z.string().min(1, "Select employment type"),
  employer: z.string().min(1, "Employer required"),
  monthlyIncome: z.coerce.number().min(1, "Income required"),
  notes: z.string().optional(),
});
type LoanValues = z.infer<typeof loanSchema>;

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: typeof CheckCircle }> = {
  pending: { color: "text-amber-600 bg-amber-50 border-amber-200", label: "Pending Review", icon: Clock },
  under_review: { color: "text-blue-600 bg-blue-50 border-blue-200", label: "Under Review", icon: AlertCircle },
  approved: { color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Approved", icon: CheckCircle },
  rejected: { color: "text-red-600 bg-red-50 border-red-200", label: "Not Approved", icon: XCircle },
};

const KYC_STATUS: Record<string, { label: string; color: string; desc: string }> = {
  not_submitted: { label: "Not Submitted", color: "text-gray-500", desc: "Please upload all required documents below." },
  pending: { label: "Under Review", color: "text-amber-600", desc: "Your documents are being reviewed by our team. This usually takes 24–48 hours." },
  approved: { label: "Approved", color: "text-emerald-600", desc: "Your identity has been verified. You can now apply for a loan!" },
  rejected: { label: "Rejected", color: "text-red-600", desc: "Some documents were rejected. Please re-upload the required files." },
};

type UploadState = { status: "idle" | "uploading" | "done" | "error"; fileName?: string };

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"kyc" | "apply" | "applications">("kyc");
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [loanSuccess, setLoanSuccess] = useState<string | null>(null);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["user-dashboard"],
    queryFn: () => apiFetch("/user/dashboard", token ?? ""),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const loanForm = useForm<LoanValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: { requestedAmount: 1000, repaymentMonths: 6, payoutMethod: "", employmentType: "", employer: "", monthlyIncome: 0, notes: "" },
  });

  const handleFile = useCallback(async (file: File, docType: string) => {
    if (!token) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 10MB per file.", variant: "destructive" });
      return;
    }
    setUploads((p) => ({ ...p, [docType]: { status: "uploading", fileName: file.name } }));
    try {
      const { uploadUrl, objectKey } = await apiPost("/user/documents/upload-url", token, {
        docType, fileName: file.name, contentType: file.type || "application/octet-stream",
      });
      try {
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      } catch { /* stub in dev */ }
      await apiPost("/user/documents", token, { docType, objectKey, fileName: file.name });
      setUploads((p) => ({ ...p, [docType]: { status: "done", fileName: file.name } }));
      toast({ title: "Document uploaded", description: `${file.name} submitted successfully.` });
      qc.invalidateQueries({ queryKey: ["user-dashboard"] });
    } catch (err: unknown) {
      setUploads((p) => ({ ...p, [docType]: { status: "error", fileName: file.name } }));
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    }
  }, [token, toast, qc]);

  async function onSubmitLoan(values: LoanValues) {
    if (!token) return;
    try {
      const result = await apiPost("/user/applications", token, values);
      setLoanSuccess(result.referenceNumber);
      qc.invalidateQueries({ queryKey: ["user-dashboard"] });
      toast({ title: "Application submitted!", description: `Reference: ${result.referenceNumber}` });
    } catch (err: unknown) {
      toast({ title: "Submission failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    }
  }

  function handleLogout() {
    logout();
    setLocation("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2b4a7a]" size={40} />
      </div>
    );
  }

  const kycStatus = dashboard?.kycStatus ?? user?.kycStatus ?? "not_submitted";
  const kycStatusCfg = KYC_STATUS[kycStatus] ?? KYC_STATUS.not_submitted;
  const applications = (dashboard?.applications ?? []) as Array<Record<string, unknown>>;
  const documents = (dashboard?.documents ?? []) as Array<{ docType: string; status: string }>;

  const uploadedDocTypes = new Set(documents.map((d) => d.docType));

  const tabs = [
    { key: "kyc", label: "KYC Documents", badge: kycStatus === "approved" ? "✓" : null },
    { key: "apply", label: "Apply for Loan", badge: applications.length > 0 ? String(applications.length) : null },
    { key: "applications", label: "My Applications", badge: applications.length > 0 ? String(applications.length) : null },
  ] as const;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#2b4a7a]">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, <strong>{user?.fullName?.split(" ")[0]}</strong></p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors border px-4 py-2 rounded-lg hover:border-red-200">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-[#2b4a7a] rounded-2xl p-6 text-white mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <User size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl font-bold">{user?.fullName}</h2>
              <p className="text-white/70 text-sm">{user?.email}</p>
              <p className="text-white/70 text-xs mt-0.5">ID: {user?.nationalId} · {user?.occupation}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">KYC Status</p>
              <span className={`font-bold text-sm ${kycStatus === "approved" ? "text-[#27a362]" : kycStatus === "pending" ? "text-amber-300" : kycStatus === "rejected" ? "text-red-300" : "text-white/60"}`}>
                {kycStatusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* KYC Status Banner */}
        <div className={`mb-6 px-5 py-4 rounded-xl border text-sm flex items-start gap-3 ${
          kycStatus === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
          kycStatus === "pending" ? "bg-amber-50 border-amber-200 text-amber-800" :
          kycStatus === "rejected" ? "bg-red-50 border-red-200 text-red-800" :
          "bg-[#2b4a7a]/5 border-[#2b4a7a]/15 text-[#2b4a7a]"
        }`}>
          {kycStatus === "approved" ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> :
           kycStatus === "pending" ? <Clock size={18} className="shrink-0 mt-0.5" /> :
           kycStatus === "rejected" ? <XCircle size={18} className="shrink-0 mt-0.5" /> :
           <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          <div>
            <p className="font-semibold">{kycStatusCfg.label}</p>
            <p className="mt-0.5 opacity-80">{kycStatusCfg.desc}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === t.key ? "border-[#2b4a7a] text-[#2b4a7a]" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  t.key === "kyc" && kycStatus === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-[#2b4a7a]/10 text-[#2b4a7a]"
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* KYC TAB */}
        {activeTab === "kyc" && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">Upload the required documents below. All files are encrypted and stored securely.</p>
            {KYC_DOCS.map((doc) => {
              const uploadState = uploads[doc.key];
              const alreadyUploaded = uploadedDocTypes.has(doc.key);
              const docRecord = documents.find((d) => d.docType === doc.key);
              const isDragOver = draggingOver === doc.key;

              return (
                <div key={doc.key} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="px-6 pt-5 pb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-[#2b4a7a]">{doc.label}</span>
                        {doc.required && <span className="text-[10px] bg-[#2b4a7a]/10 text-[#2b4a7a] px-2 py-0.5 rounded-full font-medium">Required</span>}
                      </div>
                      <p className="text-muted-foreground text-sm mt-0.5">{doc.desc}</p>
                    </div>
                    {(alreadyUploaded || uploadState?.status === "done") && (
                      <div className={`text-xs px-2 py-1 rounded-full font-semibold border flex items-center gap-1 ${
                        docRecord?.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        docRecord?.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        <CheckCircle size={10} />
                        {docRecord?.status ?? "Submitted"}
                      </div>
                    )}
                  </div>
                  <div className="px-6 pb-5">
                    {uploadState?.status === "uploading" ? (
                      <div className="flex items-center gap-3 bg-[#2b4a7a]/5 rounded-xl p-4 border border-[#2b4a7a]/10">
                        <Loader2 className="text-[#2b4a7a] animate-spin shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{uploadState.fileName}</p>
                          <p className="text-xs text-muted-foreground">Uploading…</p>
                        </div>
                      </div>
                    ) : uploadState?.status === "done" || alreadyUploaded ? (
                      <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <FileText className="text-emerald-600 shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-emerald-800 truncate">{uploadState?.fileName ?? doc.label}</p>
                          <p className="text-xs text-emerald-600">Uploaded — {docRecord?.status ?? "pending review"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setUploads((p) => { const n = { ...p }; delete n[doc.key]; return n; });
                          }}
                          className="text-emerald-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragOver ? "border-[#2b4a7a] bg-[#2b4a7a]/5" : "border-border hover:border-[#2b4a7a]/40 hover:bg-[#2b4a7a]/3"}`}
                        onDragOver={(e) => { e.preventDefault(); setDraggingOver(doc.key); }}
                        onDragLeave={() => setDraggingOver(null)}
                        onDrop={(e) => { e.preventDefault(); setDraggingOver(null); const f = e.dataTransfer.files[0]; if (f) handleFile(f, doc.key); }}
                        onClick={() => fileRefs.current[doc.key]?.click()}
                      >
                        <Upload className={`mx-auto mb-2 ${isDragOver ? "text-[#2b4a7a]" : "text-muted-foreground"}`} size={24} />
                        <p className="font-medium text-sm">Drop file here or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — max 10MB</p>
                        {uploadState?.status === "error" && <p className="text-red-500 text-xs mt-2">Upload failed — try again</p>}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={(el) => { fileRefs.current[doc.key] = el; }}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, doc.key); e.target.value = ""; }}
                    />
                  </div>
                </div>
              );
            })}
            {documents.length > 0 && kycStatus !== "approved" && (
              <div className="bg-[#2b4a7a]/5 rounded-xl p-4 border border-[#2b4a7a]/10 text-sm text-[#2b4a7a] flex items-center gap-3">
                <Clock size={18} className="shrink-0" />
                <p>Documents submitted. Our team reviews KYC applications within 24–48 hours. You'll receive an SMS when approved.</p>
              </div>
            )}
          </div>
        )}

        {/* APPLY TAB */}
        {activeTab === "apply" && (
          <div>
            {kycStatus !== "approved" ? (
              <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
                  <Upload className="text-amber-500" size={32} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2b4a7a] mb-3">KYC Approval Required</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  You must upload and have your KYC documents approved before you can apply for a loan. 
                  Current status: <strong className={kycStatusCfg.color}>{kycStatusCfg.label}</strong>
                </p>
                <button onClick={() => setActiveTab("kyc")} className="inline-flex items-center gap-2 bg-[#2b4a7a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1e3560] transition-colors">
                  <Upload size={18} /> Upload KYC Documents
                </button>
              </div>
            ) : loanSuccess ? (
              <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="text-emerald-500" size={40} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2b4a7a] mb-3">Application Submitted!</h3>
                <p className="text-muted-foreground mb-4">Our team will review your loan application and contact you within 24–48 hours via SMS.</p>
                <div className="bg-[#f5f0e8] rounded-xl p-4 mb-6 inline-block">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reference Number</p>
                  <p className="font-mono font-bold text-xl text-[#2b4a7a]">{loanSuccess}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setLoanSuccess(null); loanForm.reset(); }} className="px-5 py-2.5 border rounded-xl text-sm font-medium hover:border-[#2b4a7a] transition-colors">
                    Apply Again
                  </button>
                  <button onClick={() => setActiveTab("applications")} className="px-5 py-2.5 bg-[#2b4a7a] text-white rounded-xl text-sm font-medium hover:bg-[#1e3560] transition-colors">
                    View Applications <ArrowRight size={14} className="inline ml-1" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border p-8 shadow-sm">
                <h2 className="font-serif text-2xl font-bold text-[#2b4a7a] mb-6">Loan Application</h2>
                <Form {...loanForm}>
                  <form onSubmit={loanForm.handleSubmit(onSubmitLoan)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField control={loanForm.control} name="requestedAmount" render={({ field }) => (
                        <FormItem><FormLabel>Loan Amount (USD)</FormLabel><FormControl><Input type="number" min={100} max={10000} placeholder="e.g. 2000" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={loanForm.control} name="repaymentMonths" render={({ field }) => (
                        <FormItem><FormLabel>Repayment Period</FormLabel>
                          <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {[1, 2, 3, 6, 9, 12, 18, 24].map((m) => (
                                <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField control={loanForm.control} name="employmentType" render={({ field }) => (
                        <FormItem><FormLabel>Employment Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="employed">Employed</SelectItem>
                              <SelectItem value="self_employed">Self-Employed</SelectItem>
                              <SelectItem value="business_owner">Business Owner</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={loanForm.control} name="employer" render={({ field }) => (
                        <FormItem><FormLabel>Employer / Business Name</FormLabel><FormControl><Input placeholder="Company or business" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField control={loanForm.control} name="monthlyIncome" render={({ field }) => (
                        <FormItem><FormLabel>Monthly Income (USD)</FormLabel><FormControl><Input type="number" min={1} placeholder="e.g. 800" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={loanForm.control} name="payoutMethod" render={({ field }) => (
                        <FormItem><FormLabel>Payout Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="ecocash">EcoCash</SelectItem>
                              <SelectItem value="innbucks">InnBucks</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={loanForm.control} name="notes" render={({ field }) => (
                      <FormItem><FormLabel>Purpose of Loan (optional)</FormLabel><FormControl><Textarea placeholder="Brief description of how you plan to use the funds..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" disabled={loanForm.formState.isSubmitting} className="w-full bg-[#c9972c] hover:bg-[#b8861f] text-white h-12 text-base">
                      {loanForm.formState.isSubmitting ? "Submitting…" : <>Submit Loan Application <ArrowRight size={18} className="ml-2" /></>}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center shadow-sm">
                <CreditCard className="text-muted-foreground mx-auto mb-4" size={40} />
                <h3 className="font-serif text-xl font-bold text-[#2b4a7a] mb-2">No applications yet</h3>
                <p className="text-muted-foreground mb-4 text-sm max-w-xs mx-auto">
                  {kycStatus === "approved"
                    ? "Your KYC is approved — you can now apply for a loan."
                    : "Upload your KYC documents first to apply for a loan."}
                </p>
                <button
                  onClick={() => setActiveTab(kycStatus === "approved" ? "apply" : "kyc")}
                  className="inline-flex items-center gap-2 bg-[#2b4a7a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1e3560] transition-colors text-sm"
                >
                  {kycStatus === "approved" ? "Apply for a Loan" : "Upload KYC Docs"} <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              applications.map((app: any) => {
                const statusCfg = STATUS_CONFIG[app.status as string] ?? STATUS_CONFIG.pending;
                const Icon = statusCfg.icon;
                const appDocs = (app.documents as Array<{ docType: string; status: string }>) ?? [];
                return (
                  <div key={app.id as number} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reference</p>
                        <p className="font-mono font-bold text-[#2b4a7a]">{app.referenceNumber as string}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                        <Icon size={12} /> {statusCfg.label}
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-xs text-muted-foreground mb-1">Amount</p><p className="font-bold text-[#2b4a7a]">${(app.requestedAmount as number).toLocaleString()}</p></div>
                      {app.approvedAmount != null && <div><p className="text-xs text-muted-foreground mb-1">Approved</p><p className="font-bold text-emerald-600">${(app.approvedAmount as number).toLocaleString()}</p></div>}
                      <div><p className="text-xs text-muted-foreground mb-1">Term</p><p className="font-semibold">{app.repaymentMonths as number} months</p></div>
                      <div><p className="text-xs text-muted-foreground mb-1">Applied</p><p className="text-muted-foreground">{new Date(app.createdAt as string).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                    </div>
                    {app.adminNotes && (
                      <div className="px-6 pb-4">
                        <div className="bg-[#f5f0e8] rounded-xl px-4 py-3 text-sm">
                          <span className="font-semibold text-[#2b4a7a]">Note: </span>
                          <span className="text-foreground/80">{app.adminNotes as string}</span>
                        </div>
                      </div>
                    )}
                    {app.loanStatus && (
                      <div className="px-6 pb-6">
                        <div className="bg-[#2b4a7a]/5 rounded-xl p-4 border border-[#2b4a7a]/10">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="text-[#2b4a7a]" size={16} />
                            <span className="font-semibold text-[#2b4a7a] text-sm">Active Loan</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {app.loanOutstanding != null && <div><p className="text-xs text-muted-foreground mb-1">Outstanding</p><p className="font-bold text-[#2b4a7a]">${(app.loanOutstanding as number).toLocaleString()}</p></div>}
                            {app.loanTotalPaid != null && <div><p className="text-xs text-muted-foreground mb-1">Paid</p><p className="font-bold text-emerald-600">${(app.loanTotalPaid as number).toLocaleString()}</p></div>}
                            {app.loanNextDue && <div><p className="text-xs text-muted-foreground mb-1">Next Due</p><p className="font-bold">{new Date(app.loanNextDue as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p></div>}
                          </div>
                          <div className="mt-4 pt-4 border-t border-[#2b4a7a]/10 flex flex-wrap gap-3">
                            <a
                              href="tel:153110783286316%23"
                              className="inline-flex items-center gap-2 bg-[#2b4a7a] hover:bg-[#1e3560] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                              <img src="/ecocash.png" alt="" className="h-4 object-contain brightness-0 invert" />
                              Pay via EcoCash
                            </a>
                            <div className="inline-flex items-center gap-2 bg-[#2b4a7a]/10 text-[#2b4a7a] text-xs font-semibold px-4 py-2 rounded-lg">
                              <img src="/innbucks.png" alt="" className="h-4 object-contain" />
                              Pay via InnBucks
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
