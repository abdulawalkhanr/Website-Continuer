import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, Eye, EyeOff, Smartphone, Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Email login
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const login = useLogin();

  // Mobile login
  const [mobile, setMobile] = useState("");
  const [mobilePassword, setMobilePassword] = useState("");
  const [showMobilePassword, setShowMobilePassword] = useState(false);
  const [mobileLoading, setMobileLoading] = useState(false);

  const handleEmailLogin = () => {
    if (!email || !emailPassword) {
      toast({ title: "Please enter your email and password", variant: "destructive" });
      return;
    }
    login.mutate({ data: { email, password: emailPassword } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation(data.user.role === "CUSTOMER" ? "/dashboard" : "/admin");
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Please check your email and password.", variant: "destructive" });
      },
    });
  };

  const handleMobileLogin = async () => {
    const phone = mobile.replace(/\D/g, "");
    if (phone.length !== 10) {
      toast({ title: "Enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }
    if (!mobilePassword) {
      toast({ title: "Please enter your password", variant: "destructive" });
      return;
    }
    setMobileLoading(true);
    try {
      const res = await fetch("/api/auth/login-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: phone, password: mobilePassword }),
      });
      const data = await res.json() as { user?: { role: string }; error?: string };
      if (!res.ok) throw new Error(data.error || "Login failed");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Welcome back!" });
      setLocation(data.user?.role === "CUSTOMER" ? "/dashboard" : "/admin");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setMobileLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold gradient-text">CIR</span>
          </Link>
          <h1 className="text-2xl font-bold mt-3">Customer Login</h1>
          <p className="text-muted-foreground mt-1">Access your credit case dashboard</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <Tabs defaultValue="mobile">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="mobile" className="flex-1 gap-1.5"><Smartphone size={14} />Mobile Login</TabsTrigger>
              <TabsTrigger value="email" className="flex-1 gap-1.5"><KeyRound size={14} />Email Login</TabsTrigger>
            </TabsList>

            {/* ── MOBILE + PASSWORD TAB ── */}
            <TabsContent value="mobile">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="mobile-number">Mobile Number</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-muted border border-input rounded-md text-sm text-muted-foreground shrink-0">+91</span>
                    <Input
                      id="mobile-number"
                      type="tel"
                      maxLength={10}
                      value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      autoComplete="tel"
                      onKeyDown={e => e.key === "Enter" && handleMobileLogin()}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="mobile-password"
                      type={showMobilePassword ? "text" : "password"}
                      value={mobilePassword}
                      onChange={e => setMobilePassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="pr-10"
                      onKeyDown={e => e.key === "Enter" && handleMobileLogin()}
                    />
                    <button type="button" onClick={() => setShowMobilePassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showMobilePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full btn-gradient border-0 text-white h-11 text-base gap-2"
                  onClick={handleMobileLogin}
                  disabled={mobileLoading || mobile.length !== 10 || !mobilePassword}
                >
                  {mobileLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : <><Smartphone size={16} /> Sign In</>}
                </Button>
              </div>
            </TabsContent>

            {/* ── EMAIL + PASSWORD TAB ── */}
            <TabsContent value="email">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    autoComplete="email"
                    onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showEmailPassword ? "text" : "password"}
                      value={emailPassword}
                      onChange={e => setEmailPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="pr-10"
                      onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                    />
                    <button type="button" onClick={() => setShowEmailPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showEmailPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full btn-gradient border-0 text-white h-11 text-base"
                  onClick={handleEmailLogin}
                  disabled={login.isPending}
                >
                  {login.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6 space-y-2 text-sm text-muted-foreground">
            <div>
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">Create one free</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {["Secure 256-bit SSL encrypted connection", "Your credit data is fully private", "Access your case anytime, anywhere"].map(b => (
            <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={14} className="text-green-500 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Shield size={12} />
          <span>Protected by CIR Security</span>
        </div>
      </motion.div>
    </div>
  );
}
