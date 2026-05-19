import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, ArrowRight, ArrowLeft, Calculator } from "lucide-react";
import { useSubmitApplication, useCalculateRepayment } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const step1Schema = z.object({
  fullName: z.string().min(2, "Full name required"),
  nationalId: z.string().min(5, "National ID required"),
  phone: z.string().min(9, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  address: z.string().min(5, "Address required"),
});

const step2Schema = z.object({
  employmentType: z.string().min(1, "Employment type required"),
  employer: z.string().min(2, "Employer name required"),
  monthlyIncome: z.coerce.number().min(1, "Monthly income required"),
  requestedAmount: z.coerce.number().min(100, "Minimum loan is $100").max(10000, "Maximum loan is $10,000"),
  repaymentMonths: z.coerce.number().min(1).max(24),
  payoutMethod: z.string().min(1, "Payout method required"),
  notes: z.string().optional(),
});

const fullSchema = step1Schema.merge(step2Schema);
type FormValues = z.infer<typeof fullSchema>;

export default function Apply() {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState<{ referenceNumber: string; fullName: string } | null>(null);
  const { toast } = useToast();
  const submit = useSubmitApplication();

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      fullName: "", nationalId: "", phone: "", email: "", address: "",
      employmentType: "", employer: "", monthlyIncome: 0,
      requestedAmount: 1000, repaymentMonths: 6, payoutMethod: "", notes: "",
    },
  });

  const requestedAmount = form.watch("requestedAmount");
  const repaymentMonths = form.watch("repaymentMonths");

  const { data: calc } = useCalculateRepayment(
    { amount: requestedAmount, months: repaymentMonths },
    { query: { enabled: requestedAmount > 0 && repaymentMonths > 0 } }
  );

  async function onStep1Next() {
    const valid = await form.trigger(["fullName", "nationalId", "phone", "email", "address"]);
    if (valid) setStep(2);
  }

  async function onSubmit(values: FormValues) {
    submit.mutate({ data: values }, {
      onSuccess: (app) => {
        setSuccess({ referenceNumber: app.referenceNumber, fullName: app.fullName });
      },
      onError: () => {
        toast({ title: "Submission failed", description: "Please check your details and try again.", variant: "destructive" });
      },
    });
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl border p-10 shadow-lg">
          <div className="w-20 h-20 rounded-full bg-[#27a362]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-[#27a362]" size={40} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2b4a7a] mb-3">Application Received!</h1>
          <p className="text-muted-foreground mb-6">Thank you, <strong>{success.fullName}</strong>. We'll review your application and contact you within 24–48 hours.</p>
          <div className="bg-[#f5f0e8] rounded-2xl p-5 mb-8">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Reference Number</p>
            <p className="font-mono text-2xl font-bold text-[#2b4a7a]">{success.referenceNumber}</p>
            <p className="text-xs text-muted-foreground mt-2">Save this — use it to track your application status.</p>
          </div>
          <div className="flex flex-col gap-3">
            <a href="/status" className="w-full bg-[#2b4a7a] text-white font-semibold py-3 rounded-xl hover:bg-[#1e3560] transition-colors block text-center">
              Track My Application
            </a>
            <a href="/kyc" className="w-full border border-[#2b4a7a] text-[#2b4a7a] font-semibold py-3 rounded-xl hover:bg-[#2b4a7a]/5 transition-colors block text-center">
              Upload KYC Documents
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-4">Apply for a Loan</h1>
          <p className="text-muted-foreground text-lg">Fast, transparent, and dignified. Complete in under 5 minutes.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? "bg-[#2b4a7a] text-white" : "bg-border text-muted-foreground"}`}>{s}</div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s ? "text-[#2b4a7a]" : "text-muted-foreground"}`}>
                {s === 1 ? "Personal Details" : "Loan Details"}
              </span>
              {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? "bg-[#2b4a7a]" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="bg-white rounded-2xl border p-8 shadow-sm space-y-6">
                <h2 className="font-serif text-2xl font-bold text-[#2b4a7a]">Personal Information</h2>
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g. Chiedza Moyo" data-testid="input-fullName" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="nationalId" render={({ field }) => (
                    <FormItem><FormLabel>National ID</FormLabel><FormControl><Input placeholder="e.g. 63-1234567A78" data-testid="input-nationalId" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+263 77 234 5678" data-testid="input-phone" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="your@email.com" data-testid="input-email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Residential Address</FormLabel><FormControl><Input placeholder="14 Avondale Road, Harare" data-testid="input-address" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="button" onClick={onStep1Next} className="w-full bg-[#2b4a7a] hover:bg-[#1e3560] text-white h-12 text-base" data-testid="button-next">
                  Continue <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border p-8 shadow-sm space-y-6">
                  <h2 className="font-serif text-2xl font-bold text-[#2b4a7a]">Loan Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="employmentType" render={({ field }) => (
                      <FormItem><FormLabel>Employment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-employmentType"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self_employed">Self-Employed</SelectItem>
                            <SelectItem value="business_owner">Business Owner</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="employer" render={({ field }) => (
                      <FormItem><FormLabel>Employer / Business Name</FormLabel><FormControl><Input placeholder="Company or business" data-testid="input-employer" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="monthlyIncome" render={({ field }) => (
                    <FormItem><FormLabel>Monthly Income (USD)</FormLabel><FormControl><Input type="number" min={1} placeholder="e.g. 800" data-testid="input-monthlyIncome" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="requestedAmount" render={({ field }) => (
                      <FormItem><FormLabel>Loan Amount (USD)</FormLabel><FormControl><Input type="number" min={100} max={10000} placeholder="e.g. 2000" data-testid="input-requestedAmount" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="repaymentMonths" render={({ field }) => (
                      <FormItem><FormLabel>Repayment Period</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                          <FormControl><SelectTrigger data-testid="select-repaymentMonths"><SelectValue placeholder="Select period" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {[1, 2, 3, 6, 9, 12, 18, 24].map((m) => (
                              <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="payoutMethod" render={({ field }) => (
                    <FormItem><FormLabel>Preferred Payout Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger data-testid="select-payoutMethod"><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="ecocash">
                            <div className="flex items-center gap-2">
                              <img src="/ecocash.png" alt="" className="h-5 object-contain" /> EcoCash
                            </div>
                          </SelectItem>
                          <SelectItem value="innbucks">
                            <div className="flex items-center gap-2">
                              <img src="/innbucks.png" alt="" className="h-5 object-contain" /> InnBucks
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Additional Notes (optional)</FormLabel><FormControl><Textarea placeholder="Any additional context about your loan purpose..." data-testid="input-notes" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                {calc && (
                  <div className="bg-[#2b4a7a] rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator size={18} className="text-[#c9972c]" />
                      <span className="font-serif font-bold text-lg">Repayment Summary</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-[#c9972c] font-bold text-xl font-serif">${calc.monthlyPayment.toFixed(2)}</div>
                        <div className="text-white/60 text-xs mt-1">per month</div>
                      </div>
                      <div>
                        <div className="text-white font-bold text-xl font-serif">${calc.totalRepayable.toFixed(2)}</div>
                        <div className="text-white/60 text-xs mt-1">total repayable</div>
                      </div>
                      <div>
                        <div className="text-white/80 font-bold text-xl font-serif">${calc.interestTotal.toFixed(2)}</div>
                        <div className="text-white/60 text-xs mt-1">interest (8% p.m.)</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12" data-testid="button-back">
                    <ArrowLeft size={18} className="mr-2" /> Back
                  </Button>
                  <Button type="submit" disabled={submit.isPending} className="flex-1 bg-[#c9972c] hover:bg-[#b8861f] text-white h-12 text-base" data-testid="button-submit">
                    {submit.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
