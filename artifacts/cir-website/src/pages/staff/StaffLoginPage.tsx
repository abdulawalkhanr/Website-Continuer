import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStaffLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock } from "lucide-react";

export default function StaffLoginPage() {
  const [, setLocation] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const staffLogin = useStaffLogin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogin = () => {
    if (!identifier || !password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    staffLogin.mutate({ data: { identifier, password } }, {
      onSuccess: (data) => {
        if (data.user.role !== "STAFF") {
          toast({ title: "Access denied", description: "This portal is for authorized staff only.", variant: "destructive" });
          return;
        }
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/staff");
      },
      onError: (err) => {
        toast({ title: "Invalid credentials", description: "Please check your ID and password.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          <p className="text-slate-400 mt-1">CIR Consultation Service</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleLogin();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="staff-identifier" className="text-slate-300">Employee ID / Email / Mobile</Label>
              <Input 
                id="staff-identifier"
                type="text" 
                autoComplete="username"
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                placeholder="EMP-001 or email@cir.in" 
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password" className="text-slate-300">Password</Label>
              <Input 
                id="staff-password"
                type="password" 
                autoComplete="current-password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Your password" 
                className="bg-slate-700 border-slate-600 text-white" 
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 text-white py-6 text-base" 
              disabled={staffLogin.isPending}
            >
              {staffLogin.isPending ? "Authenticating..." : "Login to Staff Workspace"}
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield size={14} /> Secure Staff Access Only
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">Back to Public Website</Link>
        </div>
      </motion.div>
    </div>
  );
}
