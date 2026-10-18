import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirmPassword: "", city: "" });
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();
  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleRegister = () => {
    if (!form.name || !form.email || !form.mobile || !form.password) {
      toast({ title: "Name, email, mobile and password are required", variant: "destructive" });
      return;
    }
    const phone = form.mobile.replace(/\D/g, "");
    if (phone.length !== 10) {
      toast({ title: "Enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }
    if (form.password.length < 12) {
      toast({ title: "Password must be at least 12 characters", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    register.mutate(
      { data: { name: form.name, email: form.email, mobile: phone, password: form.password, city: form.city || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Account created! Welcome to CIR Consultation Service." });
          setLocation("/dashboard");
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Registration failed. Please try again.";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
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
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-muted border border-input rounded-md text-sm text-muted-foreground shrink-0">+91</span>
                <Input
                  type="tel"
                  maxLength={10}
                  value={form.mobile}
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="9876543210"
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>City <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={form.city} onChange={setField("city")} placeholder="New Delhi" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={setField("password")}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={setField("confirmPassword")}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                onKeyDown={e => e.key === "Enter" && handleRegister()}
              />
            </div>
            <Button
              className="w-full btn-gradient border-0 text-white h-11 text-base mt-2"
              onClick={handleRegister}
              disabled={register.isPending}
            >
              {register.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </div>

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
