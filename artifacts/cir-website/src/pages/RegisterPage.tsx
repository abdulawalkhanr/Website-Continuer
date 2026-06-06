import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, Eye, EyeOff, Smartphone, Loader2, KeyRound } from "lucide-react";

type OtpStep = "mobile" | "otp" | "details";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Email register
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirmPassword: "", city: "" });
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();
  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  // OTP register
  const [otpStep, setOtpStep] = useState<OtpStep>("mobile");
  const [otpMobile, setOtpMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({ name: "", city: "" });

  const handleEmailRegister = () => {
    if (!form.name || !form.email || !form.mobile || !form.password) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    register.mutate({ data: { name: form.name, email: form.email, mobile: form.mobile, password: form.password, city: form.city || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Account created! Welcome to CIR Consultation Service." });
        setLocation("/dashboard");
      },
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Registration failed. Please try again.";
        toast({ title: msg, variant: "destructive" });
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
      const data = await res.json() as { user?: { role: string }; isNewUser?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Verification failed");
      if (!data.isNewUser && data.user) {
        // Account already exists — just log in
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Welcome back! Logging you in." });
        setLocation("/dashboard");
        return;
      }
      // New user — collect details
      setOtpVerified(true);
      setDevOtp(null);
      setOtpStep("details");
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!regForm.name.trim() || regForm.name.trim().length < 2) {
      toast({ title: "Please enter your full name", variant: "destructive" });
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: otpMobile.replace(/\D/g, ""), otp: otpCode, name: regForm.name.trim(), city: regForm.city.trim() }),
      });
      const data = await res.json() as { user?: { role: string }; error?: string };
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

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold gradient-text">CIR</span>
          </Link>
          <h1 className="text-2xl font-bold mt-3">Create Your Account</h1>
          <p className="text-muted-foreground mt-1">Start your credit repair journey today</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <Tabs defaultValue="otp">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="otp" className="flex-1 gap-1.5"><Smartphone size={14} />Mobile OTP</TabsTrigger>
              <TabsTrigger value="email" className="flex-1 gap-1.5"><KeyRound size={14} />Email & Password</TabsTrigger>
            </TabsList>

            {/* ── OTP REGISTER TAB ── */}
            <TabsContent value="otp">
              {otpStep === "mobile" && (
                <div className="space-y-5">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-foreground">
                    <p className="font-medium">Quick registration with mobile OTP</p>
                    <p className="text-muted-foreground text-xs mt-0.5">No password needed. We'll verify your number and get you started in seconds.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-muted border border-input rounded-md text-sm text-muted-foreground shrink-0">+91</span>
                      <Input
                        type="tel"
                        maxLength={10}
                        value={otpMobile}
                        onChange={e => setOtpMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        autoComplete="tel"
                        onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full btn-gradient border-0 text-white h-11 text-base gap-2"
                    onClick={handleSendOtp}
                    disabled={otpLoading || otpMobile.length !== 10}
                  >
                    {otpLoading ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</> : <><Smartphone size={16} /> Send OTP</>}
                  </Button>
                </div>
              )}

              {otpStep === "otp" && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full btn-gradient flex items-center justify-center mx-auto mb-3">
                      <Smartphone size={24} className="text-white" />
                    </div>
                    <p className="font-semibold">Verify Your Number</p>
                    <p className="text-sm text-muted-foreground mt-1">OTP sent to <strong>+91 {otpMobile}</strong></p>
                  </div>

                  {devOtp && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-700 font-medium mb-1">⚠ Dev Mode — OTP not sent via SMS:</p>
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
                    {otpLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Verify Mobile Number"}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button onClick={() => { setOtpStep("mobile"); setOtpCode(""); setDevOtp(null); }} className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
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

              {otpStep === "details" && otpVerified && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                    <CheckCircle size={20} className="text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">+91 {otpMobile} verified!</p>
                      <p className="text-xs text-green-700">Now tell us your name to create your account.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={regForm.name}
                      onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Rahul Sharma"
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                    <Input
                      value={regForm.city}
                      onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="New Delhi"
                    />
                  </div>
                  <Button
                    className="w-full btn-gradient border-0 text-white h-11 text-base gap-2"
                    onClick={handleCreateAccount}
                    disabled={otpLoading || regForm.name.trim().length < 2}
                  >
                    {otpLoading ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : "Create Account & Sign In"}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ── EMAIL REGISTER TAB ── */}
            <TabsContent value="email">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={form.name} onChange={setField("name")} placeholder="Rahul Sharma" autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input type="email" value={form.email} onChange={setField("email")} placeholder="rahul@example.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input type="tel" value={form.mobile} onChange={setField("mobile")} placeholder="9876543210" autoComplete="tel" />
                </div>
                <div className="space-y-2">
                  <Label>City <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                  <Input value={form.city} onChange={setField("city")} placeholder="New Delhi" />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={setField("password")} placeholder="Minimum 6 characters" autoComplete="new-password" className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password *</Label>
                  <Input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={setField("confirmPassword")} placeholder="Re-enter your password" autoComplete="new-password" />
                </div>
                <Button
                  className="w-full btn-gradient border-0 text-white h-11 text-base"
                  onClick={handleEmailRegister}
                  disabled={register.isPending}
                >
                  {register.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in here</Link>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {["Free credit report analysis on sign-up", "Dedicated case executive assigned within 24 hrs", "Real-time case tracking via dashboard"].map(b => (
            <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={14} className="text-green-500 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Shield size={12} />
          <span>Your data is secure and private</span>
        </div>
      </motion.div>
    </div>
  );
}
