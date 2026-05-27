import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Phone, Mail, MapPin, CheckCircle, Send, MessageCircle } from "lucide-react";
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
  subject: z.string().min(2, "Subject required"),
  message: z.string().min(10, "Message too short — please provide more detail"),
});

type FormValues = z.infer<typeof schema>;

const WHATSAPP_URL = "https://wa.me/263783286316?text=Hello%20Ellen%20Finance%2C%20I%20have%20an%20enquiry.";
const MAPS_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3797.8!2d31.0522!3d-17.8315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1931a4f47b56e067%3A0x400010048be6ed0!2s6th%20Ave%2C%20Harare%2C%20Zimbabwe!5e0!3m2!1sen!2szw!4v1716000000000";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const submit = useSubmitContact();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  function onSubmit(values: FormValues) {
    submit.mutate({ data: { ...values, phone: values.phone ?? "" } }, {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Contact Info */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2b4a7a]/10 flex items-center justify-center mb-4">
                <Phone className="text-[#2b4a7a]" size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#2b4a7a] mb-1">Call Us</h3>
              <p className="text-muted-foreground text-xs mb-2">Mon–Fri, 8am–5pm</p>
              <a href="tel:+263783286316" className="font-bold text-[#2b4a7a] hover:text-[#c9972c] transition-colors">+263 78 328 6316</a>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2b4a7a]/10 flex items-center justify-center mb-4">
                <Mail className="text-[#2b4a7a]" size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#2b4a7a] mb-1">Email Us</h3>
              <a href="mailto:support@ellenfinance.co.zw" className="font-bold text-[#2b4a7a] hover:text-[#c9972c] transition-colors text-sm break-all">support@ellenfinance.co.zw</a>
            </div>

            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#2b4a7a]/10 flex items-center justify-center mb-4">
                <MapPin className="text-[#2b4a7a]" size={22} />
              </div>
              <h3 className="font-serif font-bold text-[#2b4a7a] mb-1">Headquarters</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">6th Avenue, Harare, Zimbabwe</p>
              <p className="text-muted-foreground text-xs mt-1">Mon–Fri, 8am–5pm</p>
              <a
                href="https://maps.google.com/?q=6th+Avenue,+Harare,+Zimbabwe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-[#2b4a7a] underline underline-offset-4 hover:text-[#c9972c] transition-colors"
              >
                Open in Google Maps →
              </a>
            </div>

            {/* WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-5 py-4 rounded-2xl transition-all hover:shadow-lg w-full"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <p className="text-sm font-bold">Chat on WhatsApp</p>
                <p className="text-white/80 text-xs">+263 78 328 6316</p>
              </div>
            </a>

            {/* Payment info */}
            <div className="bg-[#2b4a7a] rounded-2xl p-6 text-white">
              <h3 className="font-serif font-bold text-[#c9972c] mb-4">Repayment Details</h3>
              <div className="space-y-4">
                <a
                  href="tel:153110783286316%23"
                  className="flex items-center gap-3 hover:bg-white/10 rounded-xl p-2 -m-2 transition-colors group"
                  title="Tap to pay via EcoCash"
                >
                  <img src="/ecocash.png" alt="EcoCash" className="h-7 object-contain bg-white rounded p-0.5" />
                  <div>
                    <p className="font-bold text-sm">EcoCash</p>
                    <p className="text-white/70 text-xs group-hover:text-[#c9972c] transition-colors">Tap to make a payment</p>
                  </div>
                </a>
                <div className="flex items-center gap-3">
                  <img src="/innbucks.png" alt="InnBucks" className="h-7 object-contain bg-white rounded p-0.5" />
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
                      <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Loan enquiry, Account question" data-testid="input-subject" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea placeholder="How can we help you?" rows={5} data-testid="input-message" {...field} /></FormControl><FormMessage /></FormItem>
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

        {/* Google Maps */}
        <div className="rounded-3xl overflow-hidden border shadow-md">
          <div className="bg-[#2b4a7a] px-6 py-4 flex items-center gap-3">
            <MapPin className="text-[#c9972c]" size={20} />
            <div>
              <p className="text-white font-semibold text-sm">Ellen Finance Headquarters</p>
              <p className="text-white/60 text-xs">6th Avenue, Harare, Zimbabwe</p>
            </div>
            <a
              href="https://maps.google.com/?q=6th+Avenue,+Harare,+Zimbabwe"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Open in Maps →
            </a>
          </div>
          <iframe
            title="Ellen Finance Location — 6th Avenue, Harare, Zimbabwe"
            src={MAPS_EMBED}
            width="100%"
            height="380"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
