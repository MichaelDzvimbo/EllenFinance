import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Shield, Clock, Users, ChevronDown, CheckCircle, Phone, Star } from "lucide-react";
import { useCalculateRepayment } from "@workspace/api-client-react";

function AnimatedCounter({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

export default function Home() {
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcMonths, setCalcMonths] = useState(6);

  const { data: schedule } = useCalculateRepayment(
    { amount: calcAmount, months: calcMonths },
    { query: { enabled: calcAmount > 0 && calcMonths > 0 } }
  );

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
              Accessible microloans for Zimbabwean entrepreneurs and families. Apply in minutes, receive funds via EcoCash or InnBucks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-[#c9972c] hover:bg-[#b8861f] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#c9972c]/30 hover:-translate-y-0.5">
                Apply Now <ArrowRight size={20} />
              </Link>
              <Link href="/status" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 backdrop-blur-sm">
                Track Application
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
          <ChevronDown size={32} />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Loans Disbursed", target: 2847, suffix: "+" },
              { label: "Happy Clients", target: 1920, suffix: "+" },
              { label: "USD Disbursed", target: 4.2, suffix: "M+" },
              { label: "Approval Rate", target: 78, suffix: "%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-2">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2b4a7a] mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From application to funds in your account — a transparent, dignified process.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Apply Online", desc: "Fill out the simple application form with your personal and employment details in under 5 minutes." },
              { step: "02", title: "Submit Documents", desc: "Upload your National ID, proof of address, and income documents securely through our portal." },
              { step: "03", title: "Get Approved", desc: "Our team reviews your application and you receive a decision within 24-48 hours via SMS and email." },
              { step: "04", title: "Receive Funds", desc: "Approved funds are sent directly to your EcoCash or InnBucks wallet within hours of approval." },
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

      {/* Calculator */}
      <section className="py-24 bg-[#2b4a7a]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">Loan Calculator</h2>
              <p className="text-white/70 text-lg">See exactly what you'll pay — no hidden fees, no surprises.</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-3xl p-8 md:p-12 border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="text-white/80 text-sm font-medium block mb-3">Loan Amount: <span className="text-[#c9972c] font-bold text-lg">${calcAmount.toLocaleString()}</span></label>
                    <input type="range" min={100} max={10000} step={100} value={calcAmount}
                      onChange={(e) => setCalcAmount(Number(e.target.value))}
                      className="w-full h-2 rounded-full bg-white/20 accent-[#c9972c] cursor-pointer" />
                    <div className="flex justify-between text-white/40 text-xs mt-1"><span>$100</span><span>$10,000</span></div>
                  </div>
                  <div>
                    <label className="text-white/80 text-sm font-medium block mb-3">Repayment Period: <span className="text-[#c9972c] font-bold text-lg">{calcMonths} months</span></label>
                    <input type="range" min={1} max={24} step={1} value={calcMonths}
                      onChange={(e) => setCalcMonths(Number(e.target.value))}
                      className="w-full h-2 rounded-full bg-white/20 accent-[#c9972c] cursor-pointer" />
                    <div className="flex justify-between text-white/40 text-xs mt-1"><span>1 month</span><span>24 months</span></div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 flex flex-col justify-center space-y-5 border border-white/10">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-white/70">Monthly Payment</span>
                    <span className="text-[#c9972c] font-bold text-2xl font-serif">${schedule?.monthlyPayment.toFixed(2) ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total Repayable</span>
                    <span className="text-white font-semibold">${schedule?.totalRepayable.toFixed(2) ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Interest (8% p.m.)</span>
                    <span className="text-white/80">${schedule?.interestTotal.toFixed(2) ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-4">
                    <span className="text-white/70">Principal</span>
                    <span className="text-white">${calcAmount.toLocaleString()}</span>
                  </div>
                  <Link href="/apply" className="w-full bg-[#c9972c] hover:bg-[#b8861f] text-white font-semibold py-3 rounded-xl text-center transition-colors mt-2 block">
                    Apply for This Loan
                  </Link>
                </div>
              </div>
            </div>
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
              { icon: Clock, title: "Fast Approvals", desc: "Our streamlined process means decisions in 24-48 hours. No long queues, no unnecessary delays — just efficient service." },
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

      {/* Payment Methods */}
      <section className="py-16 bg-background border-t border-b">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-widest mb-8">Receive funds via</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-2xl border shadow-sm">
              <img src="/ecocash.png" alt="EcoCash" className="h-10 object-contain" />
              <div className="text-left">
                <div className="font-bold text-[#2b4a7a]">EcoCash</div>
                <div className="text-xs text-muted-foreground">+263 78 328 6316</div>
              </div>
            </div>
            <div className="text-muted-foreground font-medium">or</div>
            <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-2xl border shadow-sm">
              <img src="/innbucks.png" alt="InnBucks" className="h-10 object-contain" />
              <div className="text-left">
                <div className="font-bold text-[#2b4a7a]">InnBucks</div>
                <div className="text-xs text-muted-foreground">Account: Lawrence Maira</div>
              </div>
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
              { name: "Chiedza Moyo", role: "Harare, Small Business Owner", quote: "Ellen Finance helped me expand my grocery store when the banks said no. The process was smooth and the team was incredibly supportive throughout." },
              { name: "Takudzwa Banda", role: "Bulawayo, Hardware Trader", quote: "I was skeptical at first, but the transparency of the process won me over. My loan was approved in less than 48 hours and the money arrived on my EcoCash same day." },
              { name: "Rudo Chikwanda", role: "Msasa, Teacher", quote: "The repayment schedule was clear from the start — no surprises. I could plan around it. Ellen Finance treats you like a person, not just a number." },
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
            <Link href="/apply" className="inline-flex items-center gap-2 bg-white text-[#27a362] font-bold px-10 py-4 rounded-xl text-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Start Your Application <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background border-t">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-[#2b4a7a] mb-4">Ready to grow?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">Join thousands of Zimbabweans who have used Ellen Finance to fund their ambitions.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-[#2b4a7a] hover:bg-[#1e3560] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Apply for a Loan <ArrowRight size={18} />
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
