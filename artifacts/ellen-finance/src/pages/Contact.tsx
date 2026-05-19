import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Phone, Mail, MapPin, CheckCircle, Send } from "lucide-react";
import { useSubmitContact } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message too short — please provide more detail"),
});

type FormValues = z.infer<typeof schema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const submit = useSubmitContact();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  function onSubmit(values: FormValues) {
    submit.mutate({ data: values }, {
      onSuccess: () => setSubmitted(true),
      onError: () => toast({ title: "Failed to send", description: "Please try again or call us directly.", variant: "destructive" }),
    });
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-4">Get in Touch</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">We're here to help. Reach out with questions, concerns, or feedback.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2b4a7a]/10 flex items-center justify-center mb-4">
                <Phone className="text-[#2b4a7a]" size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#2b4a7a] mb-2">Call Us</h3>
              <p className="text-muted-foreground text-sm mb-2">Mon–Fri, 8am–5pm</p>
              <a href="tel:+263783286316" className="font-bold text-[#2b4a7a] hover:text-[#c9972c] transition-colors">+263 78 328 6316</a>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2b4a7a]/10 flex items-center justify-center mb-4">
                <Mail className="text-[#2b4a7a]" size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#2b4a7a] mb-2">Email Us</h3>
              <a href="mailto:support@ellenfinance.co.zw" className="font-bold text-[#2b4a7a] hover:text-[#c9972c] transition-colors text-sm break-all">support@ellenfinance.co.zw</a>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2b4a7a]/10 flex items-center justify-center mb-4">
                <MapPin className="text-[#2b4a7a]" size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#2b4a7a] mb-2">Visit Us</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Harare, Zimbabwe<br />Open Mon–Fri, 8am–5pm</p>
            </div>

            {/* Payment info */}
            <div className="bg-[#2b4a7a] rounded-2xl p-6 text-white">
              <h3 className="font-serif font-bold text-[#c9972c] mb-4">Repayment Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src="/ecocash.png" alt="EcoCash" className="h-7 object-contain bg-white rounded p-0.5" />
                  <div>
                    <p className="font-bold text-sm">EcoCash</p>
                    <p className="text-white/70 text-xs">+263 78 328 6316</p>
                    <p className="text-white/70 text-xs">Lawrence Maira</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img src="/innbucks.png" alt="InnBucks" className="h-7 object-contain bg-white rounded p-0.5" />
                  <div>
                    <p className="font-bold text-sm">InnBucks</p>
                    <p className="text-white/70 text-xs">Account: Lawrence Maira</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border p-8 shadow-sm">
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#27a362]/10 flex items-center justify-center mb-6">
                    <CheckCircle className="text-[#27a362]" size={40} />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-[#2b4a7a] mb-3">Message sent!</h2>
                  <p className="text-muted-foreground max-w-sm">Thank you for reaching out. Our team will respond within 24 hours on business days.</p>
                  <button onClick={() => { setSubmitted(false); form.reset(); }} className="mt-6 text-[#2b4a7a] text-sm underline underline-offset-4">
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-serif text-2xl font-bold text-[#2b4a7a] mb-8">Send us a message</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your name" data-testid="input-name" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>Phone (optional)</FormLabel><FormControl><Input placeholder="+263 77 xxx xxxx" data-testid="input-contact-phone" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="your@email.com" data-testid="input-contact-email" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea placeholder="How can we help you?" rows={6} data-testid="input-message" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" disabled={submit.isPending} className="w-full bg-[#2b4a7a] hover:bg-[#1e3560] text-white h-12 text-base" data-testid="button-send">
                        <Send size={18} className="mr-2" />
                        {submit.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </Form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
