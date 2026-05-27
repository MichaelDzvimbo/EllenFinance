import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { getStoredToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  nationalId: z.string().min(5, "National ID required"),
  address: z.string().min(5, "Address required"),
  occupation: z.string().min(2, "Occupation required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

type RegisterValues = z.infer<typeof registerSchema>;
type LoginValues = z.infer<typeof loginSchema>;

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function Auth() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<"register" | "login">("register");
  const [showRegPass, setShowRegPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const { user, login } = useAuth();
  const { toast } = useToast();

  // All hooks must run unconditionally (Rules of Hooks).
  // Redirect to dashboard if already authenticated — the early return below
  // suppresses rendering the form without violating hook ordering.
  useEffect(() => {
    if (user || getStoredToken()) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "login") setTab("login");
  }, []);

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", nationalId: "", address: "", occupation: "", password: "", confirmPassword: "" },
  });

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Don't flash the form while redirect is in flight
  if (user || getStoredToken()) return null;

  async function onRegister(values: RegisterValues) {
    try {
      const { token, user: newUser } = await apiPost("/auth/register", {
        fullName: values.fullName,
        email: values.email,
        nationalId: values.nationalId,
        address: values.address,
        occupation: values.occupation,
        password: values.password,
      });
      login(token, newUser as AuthUser);
      toast({ title: "Welcome to Ellen Finance!", description: "Your account has been created. Please upload your KYC documents." });
      setLocation("/dashboard");
    } catch (err: unknown) {
      toast({ title: "Registration failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    }
  }

  async function onLogin(values: LoginValues) {
    try {
      const { token, user: authUser } = await apiPost("/auth/login", values);
      login(token, authUser as AuthUser);
      toast({ title: `Welcome back, ${(authUser as AuthUser).fullName.split(" ")[0]}!` });
      setLocation("/dashboard");
    } catch (err: unknown) {
      toast({ title: "Login failed", description: err instanceof Error ? err.message : "Invalid email or password.", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Ellen Finance" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-[#2b4a7a]">
            {tab === "register" ? "Create Your Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {tab === "register" ? "Start your loan journey today" : "Sign in to your dashboard"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border p-1 mb-6 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "register" ? "bg-[#2b4a7a] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "login" ? "bg-[#2b4a7a] text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Sign In
          </button>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-8">
          {tab === "register" ? (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5" autoComplete="on">
                <FormField control={registerForm.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Chiedza Moyo"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="nationalId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 63-1234567A78" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residential Address</FormLabel>
                    <FormControl>
                      <Input placeholder="14 Avondale Road, Harare" autoComplete="street-address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="occupation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Teacher, Business Owner, Trader" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showRegPass ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowRegPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showRegPass ? "Hide password" : "Show password"}
                        >
                          {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="bg-[#f5f0e8] rounded-xl p-4 text-sm text-[#2b4a7a]/80 space-y-1">
                  {["Register your account", "Upload KYC documents", "Wait for KYC approval", "Apply for a loan"].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#2b4a7a] text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  className="w-full bg-[#2b4a7a] hover:bg-[#1e3560] text-white h-12 text-base"
                >
                  {registerForm.formState.isSubmitting ? "Creating account..." : <span className="flex items-center justify-center gap-2">Create Account <ArrowRight size={18} /></span>}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setTab("login")} className="text-[#2b4a7a] font-semibold hover:underline">Sign in</button>
                </p>
              </form>
            </Form>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5" autoComplete="on">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showLoginPass ? "text" : "password"}
                          placeholder="Your password"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setShowLoginPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showLoginPass ? "Hide password" : "Show password"}
                        >
                          {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="w-full bg-[#2b4a7a] hover:bg-[#1e3560] text-white h-12 text-base"
                >
                  {loginForm.formState.isSubmitting ? "Signing in..." : <span className="flex items-center justify-center gap-2">Sign In <ArrowRight size={18} /></span>}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-[#2b4a7a] font-semibold hover:underline">Create one</button>
                </p>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
