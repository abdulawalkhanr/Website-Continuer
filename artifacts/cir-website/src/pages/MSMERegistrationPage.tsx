import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowRight, Building2, Shield, TrendingUp, Award, Banknote, FileText } from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const benefits = [
  { icon: <Banknote size={20} className="text-green-600" />, bg: "bg-green-50", title: "Priority Bank Loans", desc: "Collateral-free loans up to ₹10 crore under CGTSME scheme with lower interest rates" },
  { icon: <Shield size={20} className="text-blue-600" />, bg: "bg-blue-50", title: "Government Subsidies", desc: "Access to technology upgradation, capital subsidy and credit-linked subsidy schemes" },
  { icon: <Award size={20} className="text-purple-600" />, bg: "bg-purple-50", title: "GST & Tax Benefits", desc: "Eligible for concession in GST, exemption from certain direct taxes and electricity bills" },
  { icon: <TrendingUp size={20} className="text-orange-600" />, bg: "bg-orange-50", title: "Tender Preference", desc: "Preference in government procurement tenders and exemption from earnest money deposit" },
  { icon: <FileText size={20} className="text-teal-600" />, bg: "bg-teal-50", title: "ISO Certification", desc: "Financial assistance for obtaining ISO certification and quality upgradation" },
  { icon: <Building2 size={20} className="text-pink-600" />, bg: "bg-pink-50", title: "Delayed Payment Protection", desc: "Payment within 45 days from MSME buyers; interest @3x bank rate on delay" },
];

const msmeCategories = [
  { type: "Micro Enterprise", inv: "Investment ≤ ₹1 crore", to: "Turnover ≤ ₹5 crore", color: "border-green-200 bg-green-50" },
  { type: "Small Enterprise", inv: "Investment ≤ ₹10 crore", to: "Turnover ≤ ₹50 crore", color: "border-blue-200 bg-blue-50" },
  { type: "Medium Enterprise", inv: "Investment ≤ ₹50 crore", to: "Turnover ≤ ₹250 crore", color: "border-purple-200 bg-purple-50" },
];

const businessTypes = ["Individual / Sole Proprietor", "Partnership Firm", "LLP", "Private Limited Company", "One Person Company", "Trust / Society", "Other"];

export default function MSMERegistrationPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", city: "", serviceRequired: "MSME / Udyam Registration", businessType: "", message: "" });
  const createLead = useCreateLead();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.name || !form.mobile) { toast({ title: "Please fill name and mobile", variant: "destructive" }); return; }
    createLead.mutate({ data: { ...form, source: "MSME_PAGE" } }, {
      onSuccess: () => {
        toast({ title: "Enquiry received!", description: "Our MSME expert will contact you within 2 hours." });
        setForm({ name: "", mobile: "", email: "", city: "", serviceRequired: "MSME / Udyam Registration", businessType: "", message: "" });
      },
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">MSME / Udyam Registration</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                MSME / Udyam Registration<br />
                <span className="gradient-text">in 1–2 Working Days</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Get your official Udyam Registration Certificate and unlock collateral-free loans, government subsidies, GST concessions and priority procurement benefits.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[{ v: "Free", l: "Govt Portal" }, { v: "1–2", l: "Day Process" }, { v: "Lifetime", l: "Certificate" }].map(s => (
                  <div key={s.l} className="text-center glass-card rounded-xl p-3">
                    <div className="text-2xl font-bold gradient-text">{s.v}</div>
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <a href="#enquiry"><Button size="lg" className="btn-gradient border-0 text-white">Register Now <ArrowRight size={18} className="ml-1" /></Button></a>
                <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer"><Button size="lg" variant="outline">WhatsApp Us</Button></a>
              </div>
            </div>
            {/* Lead Form */}
            <div id="enquiry" className="glass-card rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6">Get Free MSME Consultation</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
                  <div className="space-y-1.5"><Label>Mobile *</Label><Input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="10-digit number" /></div>
                </div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" /></div>
                <div className="space-y-1.5">
                  <Label>Business Type</Label>
                  <Select value={form.businessType} onValueChange={v => setForm(p => ({ ...p, businessType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                    <SelectContent>{businessTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" /></div>
                <div className="space-y-1.5"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us about your business..." rows={3} /></div>
                <Button className="w-full btn-gradient border-0 text-white py-5" onClick={handleSubmit} disabled={createLead.isPending}>
                  {createLead.isPending ? "Submitting..." : "Get Free Consultation"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Our expert will call you within 2 working hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MSME Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">MSME Categories</h2>
            <p className="text-muted-foreground">Check which category your business falls under</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {msmeCategories.map((cat, i) => (
              <motion.div key={cat.type} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`border-2 ${cat.color} rounded-2xl p-6 text-center`}>
                  <h3 className="text-xl font-bold mb-4">{cat.type}</h3>
                  <div className="space-y-2">
                    <div className="bg-white/60 rounded-lg p-2 text-sm">{cat.inv}</div>
                    <div className="text-muted-foreground text-xs">AND</div>
                    <div className="bg-white/60 rounded-lg p-2 text-sm">{cat.to}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-green-100 text-green-700 border-green-200">Benefits</Badge>
            <h2 className="text-3xl font-bold mb-3">Why Register as MSME?</h2>
            <p className="text-muted-foreground">Unlock exclusive benefits worth lakhs of rupees for your business</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-2xl p-5 flex gap-4">
                  <div className={`w-12 h-12 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}>{b.icon}</div>
                  <div>
                    <h4 className="font-bold mb-1">{b.title}</h4>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents Required */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Documents Required</h2>
            <p className="text-muted-foreground">Minimal documentation — we guide you through every step</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {["Aadhaar Card of proprietor / partner / director", "PAN Card of the business entity", "Business address proof (utility bill or rent agreement)", "Bank account statement or cancelled cheque", "GST registration certificate (if applicable)", "Partnership deed / MOA & AOA (as applicable)"].map((doc, i) => (
              <div key={i} className="flex items-center gap-3 glass-card rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-sm font-bold">{i + 1}</div>
                <span className="text-sm">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 btn-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Register Your MSME Today</h2>
          <p className="text-white/80 mb-6">Free government portal • Expert assistance • Get Udyam Certificate in 1–2 days</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#enquiry"><Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">Start Registration <ArrowRight size={18} className="ml-1" /></Button></a>
            <a href="tel:01169310902"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Call: 01169310902</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
