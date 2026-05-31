import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Gift, Users, DollarSign } from "lucide-react";
import { useCreateReferral } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function ReferralPage() {
  const [form, setForm] = useState({ referrerName: "", referrerMobile: "", referrerEmail: "", referrerCity: "", refereeName: "", refereeMobile: "" });
  const createReferral = useCreateReferral();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.referrerName || !form.referrerMobile || !form.refereeName || !form.refereeMobile) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createReferral.mutate({ data: { ...form, rewardAmount: 1000 } }, {
      onSuccess: () => {
        toast({ title: "Referral submitted!", description: "We will contact your referral and process your reward." });
        setForm({ referrerName: "", referrerMobile: "", referrerEmail: "", referrerCity: "", refereeName: "", refereeMobile: "" });
      },
    });
  };

  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-secondary/50 text-secondary-foreground border-secondary/30">Referral Program</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Refer. Help. <span className="gradient-text">Earn.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Refer someone with credit issues and earn ₹1,000 to ₹3,000 as reward once their case is converted
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How the Referral Program Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Users size={28} />, title: "Refer a Friend", desc: "Know someone with credit issues? Fill in their details in the form below.", reward: "Step 1" },
              { icon: <CheckCircle size={28} />, title: "We Help Them", desc: "Our team contacts your referral and guides them through credit resolution.", reward: "Step 2" },
              { icon: <Gift size={28} />, title: "You Earn Reward", desc: "Once their case is converted, you receive ₹1,000–₹3,000 directly in your bank account.", reward: "Step 3" },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="glass-card rounded-2xl p-6 text-center h-full">
                  <div className="w-14 h-14 rounded-2xl btn-gradient flex items-center justify-center text-white mx-auto mb-4">{item.icon}</div>
                  <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">{item.reward}</Badge>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reward tiers */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { tier: "Basic Conversion", reward: "₹1,000", desc: "Standard service plan" },
              { tier: "Standard Conversion", reward: "₹2,000", desc: "Premium service plan" },
              { tier: "Premium Conversion", reward: "₹3,000", desc: "Complex case resolution" },
            ].map(tier => (
              <div key={tier.tier} className="stat-card rounded-xl p-5 text-center">
                <div className="text-2xl font-bold gradient-text">{tier.reward}</div>
                <div className="text-sm font-medium mt-1">{tier.tier}</div>
                <div className="text-xs text-muted-foreground mt-1">{tier.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Form */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Submit a Referral</h2>
            <p className="text-muted-foreground mt-2">Fill in your details and your referral's information</p>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><DollarSign size={20} className="text-primary" /> Your Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name *</Label>
                  <Input data-testid="ref-name" value={form.referrerName} onChange={e => setForm(p => ({ ...p, referrerName: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Your Mobile *</Label>
                  <Input data-testid="ref-mobile" value={form.referrerMobile} onChange={e => setForm(p => ({ ...p, referrerMobile: e.target.value }))} placeholder="Mobile number" />
                </div>
                <div className="space-y-2">
                  <Label>Your Email</Label>
                  <Input data-testid="ref-email" value={form.referrerEmail} onChange={e => setForm(p => ({ ...p, referrerEmail: e.target.value }))} placeholder="Email address" />
                </div>
                <div className="space-y-2">
                  <Label>Your City</Label>
                  <Input data-testid="ref-city" value={form.referrerCity} onChange={e => setForm(p => ({ ...p, referrerCity: e.target.value }))} placeholder="City" />
                </div>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><Users size={20} className="text-primary" /> Referral's Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Referral Name *</Label>
                  <Input data-testid="ref-referee-name" value={form.refereeName} onChange={e => setForm(p => ({ ...p, refereeName: e.target.value }))} placeholder="Their name" />
                </div>
                <div className="space-y-2">
                  <Label>Referral Mobile *</Label>
                  <Input data-testid="ref-referee-mobile" value={form.refereeMobile} onChange={e => setForm(p => ({ ...p, refereeMobile: e.target.value }))} placeholder="Their mobile" />
                </div>
              </div>
            </div>
            <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-sm text-muted-foreground">Required documents to claim reward: PAN Card, Aadhaar Card, Bank Account Details, Passport Photo</p>
            </div>
            <Button className="w-full btn-gradient border-0 text-white py-6 text-base" onClick={handleSubmit} disabled={createReferral.isPending} data-testid="ref-submit">
              {createReferral.isPending ? "Submitting..." : "Submit Referral"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
