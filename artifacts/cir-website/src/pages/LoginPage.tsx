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

type OtpStep = "mobile" | "otp" | "name";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Email login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  // OTP login
  const [otpStep, setOtpStep] = useState<OtpStep>("mobile");
  const [otpMobile, setOtpMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpCity, setOtpCity] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleEmailLogin = () => {
    if (!email || !password) {
      toast({ title: "Please enter your email and password", variant: "destructive" });
      return;
    }
    login.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation(data.user.role === "CUSTOMER" ? "/dashboard" : "/admin");
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Please check your email and password.", variant: "destructive" });
      },
    });
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => setResendTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; }), 1000);
  };

  const handleSendOtp = async () => {
    const phone = otpMobile.replace(/\D/g, "");
    if (phone.length !== 10) {
      toast({ title: "Enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: phone }),
      });
      const data = await res.json() as { success?: boolean; error?: string; devOtp?: string };
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setDevOtp(data.devOtp || null);
      setOtpStep("otp");
      startResendTimer();
      toast({ title: `OTP sent to +91 ${phone}` });
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({ title: "Enter the 6-digit OTP", variant: "destructive" });
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: otpMobile.replace(/\D/g, ""), otp: otpCode }),
      });
      const data = await res.json() as { user?: { role: string }; isNewUser?: boolean; error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Verification failed");
      if (data.isNewUser && !data.user) {
        // New user — ask for name
        setOtpStep("name");
        setDevOtp(null);
        return;
      }
      // Logged in
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: data.isNewUser ? "Account created! Welcome 🎉" : "Welcome back!" });
      setLocation("/dashboard");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!otpName.trim() || otpName.trim().length < 2) {
      toast({ title: "Please enter your full name", variant: "destructive" });
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: otpMobile.replace(/\D/g, ""), otp: otpCode, name: otpName.trim(), city: otpCity.trim() }),
      });
      const data = await res.json() as { user?: { role: string }; isNewUser?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Registration failed");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Account created! Welcome to CIR Consultation Service 🎉" });
      setLocation("/dashboard");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const resetOtp = () => { setOtpStep("mobile"); setOtpCode(""); setOtpName(""); setOtpCity(""); setDevOtp(null); };

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
          <Tabs defaultValue="otp">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="otp" className="flex-1 gap-1.5"><Smartphone size={14} />Mobile OTP</TabsTrigger>
              <TabsTrigger value="email" className="flex-1 gap-1.5"><KeyRound size={14} />Email Login</TabsTrigger>
            </TabsList>

            {/* ── OTP TAB ── */}
            <TabsContent value="otp">
              {otpStep === "mobile" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp-mobile">Mobile Number</Label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-muted border border-input rounded-md text-sm text-muted-foreground shrink-0">+91</span>
                      <Input
                        id="otp-mobile"
                        type="tel"
                        maxLength={10}
                        value={otpMobile}
                        onChange={e => setOtpMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        autoComplete="tel"
                        onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">We'll send a 6-digit OTP to verify your number.</p>
                  </div>
                  <Button
                    className="w-full btn-gradient border-0 text-white h-11 text-base gap-2"
                    onClick={handleSendOtp}
                    disabled={otpLoading || otpMobile.length !== 10}
                  >
                    {otpLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Smartphone size={16} /> Send OTP</>}
                  </Button>
                </div>
              )}

              {otpStep === "otp" && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full btn-gradient flex items-center justify-center mx-auto mb-3">
                      <Smartphone size={24} className="text-white" />
                    </div>
                    <p className="font-semibold">Enter OTP</p>
                    <p className="text-sm text-muted-foreground mt-1">Sent to <strong>+91 {otpMobile}</strong></p>
                  </div>

                  {devOtp && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-700 font-medium mb-1">⚠ SMS not configured — Dev Mode OTP:</p>
                      <p className="text-2xl font-bold tracking-widest text-amber-800">{devOtp}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>6-Digit OTP</Label>
                    <Input
                      type="tel"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      className="text-center text-2xl tracking-widest h-14 font-bold"
                      autoComplete="one-time-code"
                      onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                    />
                  </div>

                  <Button
                    className="w-full btn-gradient border-0 text-white h-11 text-base gap-2"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpCode.length !== 6}
                  >
                    {otpLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Verify & Sign In"}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button onClick={resetOtp} className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                      ← Change number
                    </button>
                    {resendTimer > 0 ? (
                      <span className="text-muted-foreground">Resend in {resendTimer}s</span>
                    ) : (
                      <button onClick={handleSendOtp} disabled={otpLoading} className="text-primary hover:underline font-medium">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              {otpStep === "name" && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <p className="font-semibold text-green-700">Mobile Verified!</p>
                    <p className="text-sm text-muted-foreground mt-1">Just one more step to create your account.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Your Full Name *</Label>
                    <Input
                      value={otpName}
                      onChange={e => setOtpName(e.target.value)}
                      placeholder="Rahul Sharma"
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      value={otpCity}
                      onChange={e => setOtpCity(e.target.value)}
                      placeholder="New Delhi"
                    />
                  </div>
                  <Button
                    className="w-full btn-gradient border-0 text-white h-11 text-base gap-2"
                    onClick={handleCompleteRegistration}
                    disabled={otpLoading || otpName.trim().length < 2}
                  >
                    {otpLoading ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : "Create Account & Sign In"}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ── EMAIL TAB ── */}
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
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="pr-10"
                      onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
