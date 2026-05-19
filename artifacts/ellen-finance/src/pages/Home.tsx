import { Link } from "wouter";
import { ArrowRight, Shield, Clock, Users, CheckCircle, Phone, Star, Download, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-[hsl(216,48%,18%)] via-[hsl(216,48%,22%)] to-[hsl(216,48%,28%)] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[#c9972c] blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#27a362] blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#c9972c]/20 border border-[#c9972c]/30 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#27a362] animate-pulse" />
              <span className="text-[#c9972c] text-sm font-medium">Trusted by Zimbabweans since 2019</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Financial freedom<br />
              <span className="text-[#c9972c]">starts here.</span>
            </h1>
            <p className="text-white/70 text-xl md:text-2xl leading-relaxed mb-10 max-w-xl font-light">
              Accessible microloans for Zimbabwean entrepreneurs and families. Create a free account and access funding in days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 bg-[#c9972c] hover:bg-[#b8861f] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#c9972c]/30 hover:-translate-y-0.5">
                  Go to My Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link href="/auth" className="inline-flex items-center justify-center gap-2 bg-[#c9972c] hover:bg-[#b8861f] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#c9972c]/30 hover:-translate-y-0.5">
                    Create Free Account <ArrowRight size={20} />
                  </Link>
                  <Link href="/auth?tab=login" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 backdrop-blur-sm">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From registration to funds in your account — a transparent, four-step process.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Create Account", desc: "Register with your full name, email, National ID, address and occupation. It takes under 2 minutes." },
              { step: "02", title: "Upload KYC Docs", desc: "Submit your National ID, proof of address and payslip securely through your dashboard." },
              { step: "03", title: "Get Approved", desc: "Our team reviews your documents and application. You receive a decision within 24–48 hours via SMS." },
              { step: "04", title: "Receive Funds", desc: "Approved funds land in your EcoCash or InnBucks wallet within hours of approval." },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 3 && <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#c9972c]/40 to-transparent z-0" />}
                <div className="relative z-10 bg-white rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-serif text-5xl font-bold text-[#c9972c]/20 mb-4">{item.step}</div>
                  <h3 className="font-serif text-xl font-bold text-[#2b4a7a] mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-4">Why Ellen Finance?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Secure & Regulated", desc: "Your personal information is encrypted and protected. We operate under strict financial regulations to keep your data safe." },
              { icon: Clock, title: "Fast Approvals", desc: "Our streamlined digital process means decisions in 24–48 hours. No long queues, no unnecessary delays." },
              { icon: Users, title: "Real Human Support", desc: "Every application is reviewed by our Zimbabwean team. We understand local contexts and community needs deeply." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-8 rounded-2xl border border-border hover:border-[#c9972c]/40 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#2b4a7a]/10 flex items-center justify-center mb-6 group-hover:bg-[#2b4a7a] transition-colors">
                  <Icon className="text-[#2b4a7a] group-hover:text-white transition-colors" size={28} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#2b4a7a] mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Application PDF Download */}
      <section className="py-20 bg-[#2b4a7a]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="text-[#c9972c]" size={36} />
            </div>
            <h2 className="font-serif text-4xl font-bold text-white mb-4">Prefer a Paper Form?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">Download our official Zimbabwean Microfinance Loan Application Form. Fill it out and visit our offices at 6th Avenue, Harare.</p>
            <a
              href="/api/loan-application-form.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#c9972c] hover:bg-[#b8861f] text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Download size={22} /> Download Application Form (PDF)
            </a>
            <p className="text-white/40 text-sm mt-4">PDF • Microfinance Loan Application — Ellen Finance Zimbabwe</p>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-24 bg-[#27a362]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">Do you qualify?</h2>
            <p className="text-white/80 text-lg mb-12">Our eligibility requirements are straightforward and designed to be inclusive.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-12">
              {[
                "Zimbabwean citizen or resident",
                "Valid National ID",
                "Stable income (employed or self-employed)",
                "Active EcoCash or InnBucks account",
                "Ages 18 to 65",
                "No active loan defaults",
              ].map((req) => (
                <div key={req} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-5 py-4 border border-white/20">
                  <CheckCircle className="text-white shrink-0" size={20} />
                  <span className="text-white font-medium">{req}</span>
                </div>
              ))}
            </div>
            <Link href="/auth" className="inline-flex items-center gap-2 bg-white text-[#27a362] font-bold px-10 py-4 rounded-xl text-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Create Free Account <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 bg-background border-t border-b">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-widest mb-8">Receive funds via</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-2xl border shadow-sm">
              <img src="/ecocash.png" alt="EcoCash" className="h-10 object-contain" />
              <div className="text-left"><div className="font-bold text-[#2b4a7a]">EcoCash</div><div className="text-xs text-muted-foreground">+263 78 328 6316</div></div>
            </div>
            <div className="text-muted-foreground font-medium">or</div>
            <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-2xl border shadow-sm">
              <img src="/innbucks.png" alt="InnBucks" className="h-10 object-contain" />
              <div className="text-left"><div className="font-bold text-[#2b4a7a]">InnBucks</div><div className="text-xs text-muted-foreground">Account: Lawrence Maira</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-[#2b4a7a] mb-4">What our clients say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Chiedza Moyo", role: "Harare, Small Business Owner", quote: "Ellen Finance helped me expand my grocery store when the banks said no. The online process was smooth and the team was incredibly supportive." },
              { name: "Takudzwa Banda", role: "Bulawayo, Hardware Trader", quote: "I registered online, uploaded my documents and had my loan approved in 48 hours. Money was on my EcoCash the same day. Truly remarkable." },
              { name: "Rudo Chikwanda", role: "Msasa, Teacher", quote: "The dashboard made everything clear — I could see exactly what was happening with my application and when my next payment was due. No surprises." },
            ].map((t, i) => (
              <div key={i} className="bg-background rounded-2xl p-8 border border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} className="fill-[#c9972c] text-[#c9972c]" />)}
                </div>
                <p className="text-foreground/80 leading-relaxed mb-6 font-serif italic">"{t.quote}"</p>
                <div>
                  <div className="font-bold text-[#2b4a7a]">{t.name}</div>
                  <div className="text-muted-foreground text-sm">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-[#2b4a7a] mb-4">Ready to grow?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">Join thousands of Zimbabweans who have used Ellen Finance to fund their ambitions.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth" className="inline-flex items-center justify-center gap-2 bg-[#2b4a7a] hover:bg-[#1e3560] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border border-border hover:border-[#2b4a7a] text-foreground font-semibold px-8 py-4 rounded-lg transition-colors">
              <Phone size={18} /> Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
