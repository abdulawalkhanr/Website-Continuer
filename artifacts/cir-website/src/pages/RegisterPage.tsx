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
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirmPassword: "", city: "" });
  const [showPassword, setShowPassword] = useState(false);
  const register = useRegister();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleRegister = () => {
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
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={set("name")} placeholder="Rahul Sharma" autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input type="email" value={form.email} onChange={set("email")} placeholder="rahul@example.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input type="tel" value={form.mobile} onChange={set("mobile")} placeholder="9876543210" autoComplete="tel" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={set("city")} placeholder="New Delhi (optional)" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Minimum 6 characters" autoComplete="new-password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter your password" autoComplete="new-password" />
            </div>
            <Button
              className="w-full btn-gradient border-0 text-white h-11 text-base"
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

        {/* Benefits */}
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
