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
import { Shield, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const login = useLogin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleEmailLogin = () => {
    if (!email || !password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    login.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        if (data.user.role === "CUSTOMER") {
          setLocation("/dashboard");
        } else {
          setLocation("/admin");
        }
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Please check your email and password.", variant: "destructive" });
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
          <h1 className="text-2xl font-bold mt-3">Customer Login</h1>
          <p className="text-muted-foreground mt-1">Access your credit case dashboard</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <Tabs defaultValue="email">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="email" className="flex-1">Email Login</TabsTrigger>
              <TabsTrigger value="otp" className="flex-1">Mobile OTP</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input data-testid="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key === "Enter" && handleEmailLogin()} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input data-testid="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" onKeyDown={e => e.key === "Enter" && handleEmailLogin()} />
                </div>
                <Button className="w-full btn-gradient border-0 text-white py-6 text-base" onClick={handleEmailLogin} disabled={login.isPending} data-testid="login-submit">
                  {login.isPending ? "Logging in..." : "Login"}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="otp">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input data-testid="login-mobile" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="10-digit mobile number" />
                </div>
                <Button className="w-full btn-gradient border-0 text-white py-6" disabled>
                  Send OTP (Coming Soon)
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t border-border">
            <Button variant="outline" className="w-full flex items-center gap-2" disabled>
              <Shield size={18} className="text-primary" /> Continue with Google (Coming Soon)
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle size={14} className="text-green-500 shrink-0" />
            <span>Your data is encrypted and secure</span>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Need help? Call <a href="tel:01169310902" className="text-primary hover:underline">01169310902</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
