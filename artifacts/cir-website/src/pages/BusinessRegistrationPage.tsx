import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowRight, Building2, Users, Shield, TrendingUp, FileText, Briefcase } from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const structures = [
  {
    title: "Proprietorship",
    icon: "👤",
    idealFor: "Individual entrepreneurs & freelancers",
    pros: ["Easiest to start", "No minimum capital", "Complete control", "Lower compliance"],
    cons: ["Unlimited liability", "No separate legal entity"],
    timeline: "1–3 days",
  },
  {
    title: "Partnership Firm",
    icon: "🤝",
    idealFor: "2–20 partners running a business together",
    pros: ["Easy formation", "Shared resources", "Flexible profit sharing", "Simple compliance"],
    cons: ["Unlimited liability", "Disputes risk"],
    timeline: "3–5 days",
  },
  {
    title: "LLP",
    icon: "⚖️",
    idealFor: "Professionals, service businesses & startups",
    pros: ["Limited liability", "Separate legal entity", "Low compliance vs Pvt Ltd", "Flexible structure"],
    cons: ["FDI restrictions", "Cannot raise equity"],
    timeline: "7–14 days",
  },
  {
    title: "Private Limited Company",
    icon: "🏢",
    idealFor: "Startups, scalable businesses & VC-backed companies",
    pros: ["Limited liability", "Easy funding", "Separate legal entity", "Maximum credibility"],
    cons: ["Higher compliance", "Audit required"],
    timeline: "10–15 days",
  },
];

const otherServices = [
  { title: "Shop & Establishment Registration", desc: "Mandatory local license for all shops, offices and commercial establishments.", icon: <Building2 size={18} className="text-blue-600" /> },
  { title: "Trade License", desc: "License from municipal corporation to legally carry on trade or business activities.", icon: <FileText size={18} className="text-green-600" /> },
  { title: "Professional Tax Registration", desc: "State-level professional tax registration for employers and self-employed professionals.", icon: <Briefcase size={18} className="text-purple-600" /> },
  { title: "Startup Registration", desc: "DPIIT recognition for eligible startups — access to tax benefits and government schemes.", icon: <TrendingUp size={18} className="text-orange-600" /> },
  { title: "Import Export Code (IEC)", desc: "Mandatory DGFT registration for businesses involved in import/export of goods.", icon: <Shield size={18} className="text-teal-600" /> },
  { title: "Digital Signature Certificate (DSC)", desc: "Class 2/3 DSC for MCA filings, ITR, GST and government portal submissions.", icon: <Users size={18} className="text-pink-600" /> },
];

const bizServices = ["Proprietorship Registration", "Partnership Firm Registration", "LLP Registration", "Private Limited Company Registration", "Shop & Establishment Registration", "Trade License", "Startup / DPIIT Registration", "Professional Tax Registration", "Import Export Code (IEC)", "Digital Signature Certificate (DSC)", "Other"];

export default function BusinessRegistrationPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", city: "", serviceRequired: "", businessType: "", message: "" });
  const createLead = useCreateLead();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.name || !form.mobile) { toast({ title: "Please fill name and mobile", variant: "destructive" }); return; }
    createLead.mutate({ data: { ...form, source: "BIZ_REG_PAGE" } }, {
      onSuccess: () => {
        toast({ title: "Enquiry received!", description: "Our business registration expert will contact you within 2 hours." });
        setForm({ name: "", mobile: "", email: "", city: "", serviceRequired: "", businessType: "", message: "" });
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
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">Business Registration</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Business Registration &<br />
                <span className="gradient-text">Compliance Services</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                From Proprietorship to Private Limited Company — we handle complete business registration, licensing and compliance for startups and enterprises across India.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {["Proprietorship", "Partnership", "LLP", "Pvt Ltd", "Startup"].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{tag}</span>
                ))}
              </div>
              <div className="flex gap-4">
                <a href="#enquiry"><Button size="lg" className="btn-gradient border-0 text-white">Get Started <ArrowRight size={18} className="ml-1" /></Button></a>
                <a href="https://wa.me/916900637638" target="_blank" rel="noopener noreferrer"><Button size="lg" variant="outline">WhatsApp Us</Button></a>
              </div>
            </div>
            {/* Lead Form */}
            <div id="enquiry" className="glass-card rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6">Free Business Registration Consultation</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
                  <div className="space-y-1.5"><Label>Mobile *</Label><Input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="10-digit number" /></div>
                </div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" /></div>
                <div className="space-y-1.5">
                  <Label>Service Required</Label>
                  <Select value={form.serviceRequired} onValueChange={v => setForm(p => ({ ...p, serviceRequired: v }))}>
                    <SelectTrigger><SelectValue placeholder="What do you need?" /></SelectTrigger>
                    <SelectContent>{bizServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" /></div>
                <div className="space-y-1.5"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us about your business idea..." rows={3} /></div>
                <Button className="w-full btn-gradient border-0 text-white py-5" onClick={handleSubmit} disabled={createLead.isPending}>
                  {createLead.isPending ? "Submitting..." : "Get Free Expert Advice"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structure Comparison */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Choose the Right Business Structure</h2>
            <p className="text-muted-foreground">Our experts will help you pick the best structure for your goals, budget and growth plans</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {structures.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="font-bold text-lg gradient-text mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{s.idealFor}</p>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-700 mb-1.5">Advantages:</p>
                    <ul className="space-y-1">{s.pros.map(p => <li key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle size={11} className="text-green-500 shrink-0" />{p}</li>)}</ul>
                  </div>
                  <div className="mt-auto pt-3 border-t border-border">
                    <span className="text-xs font-medium text-primary">⏱ {s.timeline}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Licenses & Other Registrations</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherServices.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-xl p-5 flex gap-4 h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{s.icon}</div>
                  <div>
                    <h4 className="font-bold mb-1 text-sm">{s.title}</h4>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 btn-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start Your Business the Right Way</h2>
          <p className="text-white/80 mb-6">Free consultation • Expert guidance • End-to-end support</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#enquiry"><Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">Register My Business <ArrowRight size={18} className="ml-1" /></Button></a>
            <a href="tel:01169296558"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Call: 01169296558</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
