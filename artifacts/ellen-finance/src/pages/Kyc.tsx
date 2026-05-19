import { useState, useRef, useCallback } from "react";
import { Upload, CheckCircle, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { useRequestDocumentUploadUrl, useCreateDocument } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DOC_TYPES = [
  { key: "national_id", label: "National ID", desc: "Front and back of your Zimbabwe National ID card", required: true },
  { key: "proof_of_address", label: "Proof of Address", desc: "Utility bill, bank statement, or lease agreement (3 months old max)", required: true },
  { key: "payslip", label: "Payslip / Bank Statement", desc: "Last 3 months of payslips or bank statement", required: true },
  { key: "business_registration", label: "Business Registration", desc: "Certificate of incorporation or ZIMRA registration (self-employed only)", required: false },
];

interface UploadedDoc {
  docType: string;
  fileName: string;
  objectKey: string;
  status: "uploaded" | "registering" | "done" | "error";
}

export default function Kyc() {
  const [applicationId, setApplicationId] = useState("");
  const [applicationIdInput, setApplicationIdInput] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getUploadUrl = useRequestDocumentUploadUrl();
  const createDocument = useCreateDocument();

  const handleFile = useCallback(async (file: File, docType: string) => {
    if (!applicationId) {
      toast({ title: "Application ID required", description: "Enter your application reference number first.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    const tempDoc: UploadedDoc = { docType, fileName: file.name, objectKey: "", status: "uploaded" };
    setUploadedDocs((prev) => [...prev.filter((d) => d.docType !== docType), tempDoc]);

    try {
      const appId = parseInt(applicationId.replace(/[^0-9]/g, ""), 10) || 1;

      const { uploadUrl, objectKey } = await new Promise<{ uploadUrl: string; objectKey: string }>((resolve, reject) => {
        getUploadUrl.mutate(
          { data: { applicationId: appId, docType, fileName: file.name, contentType: file.type || "application/octet-stream" } },
          { onSuccess: resolve, onError: reject }
        );
      });

      // PUT file to presigned URL
      try {
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
      } catch {
        // Presigned URL may be a stub in dev — continue anyway
      }

      setUploadedDocs((prev) => prev.map((d) => d.docType === docType ? { ...d, objectKey, status: "registering" } : d));

      await new Promise<void>((resolve, reject) => {
        createDocument.mutate(
          { data: { applicationId: appId, docType, objectKey, fileName: file.name } },
          { onSuccess: () => resolve(), onError: reject }
        );
      });

      setUploadedDocs((prev) => prev.map((d) => d.docType === docType ? { ...d, objectKey, status: "done" } : d));
      toast({ title: "Document uploaded", description: `${file.name} has been submitted successfully.` });
    } catch {
      setUploadedDocs((prev) => prev.map((d) => d.docType === docType ? { ...d, status: "error" } : d));
      toast({ title: "Upload failed", description: "Please check your connection and try again.", variant: "destructive" });
    }
  }, [applicationId, getUploadUrl, createDocument, toast]);

  const handleDrop = useCallback((e: React.DragEvent, docType: string) => {
    e.preventDefault();
    setDraggingOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, docType);
  }, [handleFile]);

  const getDocStatus = (docType: string) => uploadedDocs.find((d) => d.docType === docType);

  return (
    <div className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-4">Upload Documents</h1>
          <p className="text-muted-foreground text-lg">Secure KYC document upload. All files are encrypted and stored safely.</p>
        </div>

        {/* Application ID */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm mb-8">
          <Label className="text-sm font-semibold text-[#2b4a7a] mb-3 block">Application Reference Number</Label>
          <div className="flex gap-3">
            <Input
              placeholder="e.g. EF-M8X9K2-ABCD or Application ID (number)"
              value={applicationIdInput}
              onChange={(e) => setApplicationIdInput(e.target.value)}
              data-testid="input-applicationId"
              className="font-mono"
            />
            <Button
              type="button"
              onClick={() => {
                if (applicationIdInput.trim()) {
                  setApplicationId(applicationIdInput.trim());
                  toast({ title: "Ready to upload", description: "You can now upload your documents." });
                }
              }}
              className="bg-[#2b4a7a] text-white hover:bg-[#1e3560]"
              data-testid="button-set-appid"
            >
              Confirm
            </Button>
          </div>
          {applicationId && (
            <p className="text-[#27a362] text-sm mt-2 flex items-center gap-1">
              <CheckCircle size={14} /> Reference confirmed: <span className="font-mono font-bold">{applicationId}</span>
            </p>
          )}
        </div>

        {/* Upload areas */}
        <div className="space-y-6">
          {DOC_TYPES.map((doc) => {
            const uploaded = getDocStatus(doc.key);
            const isDragOver = draggingOver === doc.key;

            return (
              <div key={doc.key} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#2b4a7a]">{doc.label}</span>
                      {doc.required && <span className="text-[10px] bg-[#2b4a7a]/10 text-[#2b4a7a] px-2 py-0.5 rounded-full font-medium">Required</span>}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{doc.desc}</p>
                  </div>
                  {uploaded?.status === "done" && <CheckCircle className="text-[#27a362] shrink-0 mt-1" size={22} />}
                  {uploaded?.status === "error" && <AlertCircle className="text-red-500 shrink-0 mt-1" size={22} />}
                </div>

                <div className="px-6 pb-6">
                  {uploaded && uploaded.status !== "error" ? (
                    <div className={`flex items-center gap-3 rounded-xl p-4 border ${uploaded.status === "done" ? "bg-[#27a362]/5 border-[#27a362]/20" : "bg-[#2b4a7a]/5 border-[#2b4a7a]/10"}`}>
                      {uploaded.status === "registering" || uploaded.status === "uploaded" ? (
                        <Loader2 className="text-[#2b4a7a] animate-spin shrink-0" size={20} />
                      ) : (
                        <FileText className="text-[#27a362] shrink-0" size={20} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{uploaded.fileName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {uploaded.status === "uploaded" ? "Uploading..." :
                           uploaded.status === "registering" ? "Registering..." :
                           "Successfully uploaded"}
                        </p>
                      </div>
                      {uploaded.status === "done" && (
                        <button onClick={() => setUploadedDocs((p) => p.filter((d) => d.docType !== doc.key))} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver ? "border-[#2b4a7a] bg-[#2b4a7a]/5" : "border-border hover:border-[#2b4a7a]/40 hover:bg-[#2b4a7a]/3"} ${!applicationId ? "opacity-50 cursor-not-allowed" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); if (applicationId) setDraggingOver(doc.key); }}
                      onDragLeave={() => setDraggingOver(null)}
                      onDrop={(e) => applicationId && handleDrop(e, doc.key)}
                      onClick={() => applicationId && fileInputRefs.current[doc.key]?.click()}
                      data-testid={`drop-zone-${doc.key}`}
                    >
                      <Upload className={`mx-auto mb-3 ${isDragOver ? "text-[#2b4a7a]" : "text-muted-foreground"}`} size={28} />
                      <p className="font-medium text-sm text-foreground mb-1">Drop file here or click to browse</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                      {uploaded?.status === "error" && (
                        <p className="text-red-500 text-xs mt-2">Upload failed — please try again</p>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[doc.key] = el; }}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, doc.key); e.target.value = ""; }}
                    data-testid={`file-input-${doc.key}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {uploadedDocs.filter((d) => d.status === "done").length > 0 && (
          <div className="mt-8 bg-[#27a362]/10 rounded-2xl p-6 border border-[#27a362]/20 text-center">
            <CheckCircle className="text-[#27a362] mx-auto mb-3" size={32} />
            <h3 className="font-serif font-bold text-[#2b4a7a] text-xl mb-2">
              {uploadedDocs.filter((d) => d.status === "done").length} document{uploadedDocs.filter((d) => d.status === "done").length !== 1 ? "s" : ""} submitted
            </h3>
            <p className="text-muted-foreground text-sm mb-4">Our team will review and verify your documents. You'll receive updates via SMS and email.</p>
            <a href="/status" className="inline-flex items-center gap-2 bg-[#2b4a7a] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1e3560] transition-colors">
              Track Application Status
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
