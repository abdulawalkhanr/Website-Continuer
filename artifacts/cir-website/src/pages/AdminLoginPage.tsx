import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogin = () => {
    if (!email || !password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    login.mutate({ data: { email: email.trim().toLowerCase(), password } }, {
      onSuccess: (data) => {
        if (!data?.user) {
          toast({ title: "Login API configuration error", description: "The server did not return a sign-in response. Please check the Hostinger entry file.", variant: "destructive" });
          return;
        }
        if (!["OWNER", "MANAGER", "EXECUTIVE"].includes(data.user.role)) {
          toast({ title: "Access denied", description: "This portal is for admin users only.", variant: "destructive" });
          return;
        }
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/admin");
      },
      onError: (error: unknown) => {
        const status = error instanceof ApiError ? error.status : undefined;
        const body = error instanceof ApiError ? error.data as { error?: string } | null : null;
        if (status && status >= 500) {
          toast({
            title: "Login service temporarily unavailable",
            description: body?.error || "The database or sign-in session could not be reached. Please check Hostinger runtime logs.",
            variant: "destructive",
          });
          return;
        }
        if (status) {
          toast({ title: body?.error || `Sign-in request failed (${status})`, variant: "destructive" });
        } else {
          toast({ title: "Could not reach the login service", description: "Please refresh the page and check your internet connection. This is not a password error.", variant: "destructive" });
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl btn-gradient flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-1">CIR Consultation Service</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300">Email Address</Label>
              <Input data-testid="admin-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your administrator email" className="bg-slate-700 border-slate-600 text-white placeholder-slate-400" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Password</Label>
              <Input data-testid="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="bg-slate-700 border-slate-600 text-white" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <Button className="w-full btn-gradient border-0 text-white py-6 text-base" onClick={handleLogin} disabled={login.isPending} data-testid="admin-login-submit">
              {login.isPending ? "Logging in..." : "Login to Admin Panel"}
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
            <Shield size={14} /> Restricted access — authorized personnel only
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Back to Website</Link>
        </div>
      </motion.div>
    </div>
  );
}
