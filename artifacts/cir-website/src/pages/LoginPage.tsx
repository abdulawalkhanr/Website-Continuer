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
import { Shield, CheckCircle, Eye, EyeOff, MessageCircle } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const login = useLogin();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleEmailLogin = () => {
    if (!email || !password) {
      toast({ title: "Please enter your email and password", variant: "destructive" });
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

            <TabsContent value="otp">
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">OTP Login Coming Soon</p>
                  <p>Mobile OTP login is currently under development. Please use Email Login or contact us for assistance.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="9876543210"
                    disabled
                  />
                </div>
                <Button className="w-full" variant="outline" disabled>
                  Send OTP (Coming Soon)
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Need help logging in? Contact us on{" "}
                  <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline inline-flex items-center gap-1">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                </div>
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
