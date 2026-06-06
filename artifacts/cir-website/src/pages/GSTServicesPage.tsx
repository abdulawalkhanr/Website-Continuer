import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowRight, Calculator, Clock, Shield, Users, FileText, AlertCircle } from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const services = [
  { title: "GST Registration", desc: "Get your GSTIN in 3–7 working days. Mandatory for businesses with turnover above ₹20 lakh (₹10 lakh for NE states).", steps: ["Document collection", "Application preparation", "ARN generation", "GSTIN issuance"] },
  { title: "GST Return Filing", desc: "Timely and accurate filing of GSTR-1, GSTR-3B, GSTR-9 and other returns to avoid penalties.", steps: ["Sales & purchase reconciliation", "GSTR-1 filing", "GSTR-3B filing", "Annual return (GSTR-9)"] },
  { title: "GST Compliance Assistance", desc: "End-to-end compliance support including ITC reconciliation, notice handling, and audit assistance.", steps: ["ITC reconciliation", "2A/2B matching", "Notice drafting & reply", "Audit support"] },
  { title: "GST Amendment Services", desc: "Update your GST registration details — address, partners, phone, bank account, and more.", steps: ["Identify changes required", "Document preparation", "Amendment application", "Approval tracking"] },
  { title: "GST Cancellation", desc: "Proper GST registration cancellation / surrender for businesses winding down or below threshold.", steps: ["Final return filing", "Cancellation application", "Pending liability clearance", "Cancellation order"] },
  { title: "GST Annual Return", desc: "GSTR-9 and GSTR-9C reconciliation and filing before the annual deadline.", steps: ["Data compilation", "Reconciliation with books", "GSTR-9 preparation", "CA-certified GSTR-9C"] },
];

const gstServices = ["GST Registration", "GST Return Filing (GSTR-1/3B)", "GST Annual Return (GSTR-9)", "GST Amendment", "GST Cancellation", "GST Compliance & Notice Reply", "ITC Reconciliation", "Other GST Service"];
const businessTypes = ["Individual / Sole Proprietor", "Partnership Firm", "LLP", "Private Limited Company", "Public Limited Company", "HUF", "Trust / Society", "Other"];

export default function GSTServicesPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", city: "", serviceRequired: "", businessType: "", message: "" });
  const createLead = useCreateLead();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.name || !form.mobile) { toast({ title: "Please fill name and mobile", variant: "destructive" }); return; }
    createLead.mutate({ data: { ...form, source: "GST_PAGE" } }, {
      onSuccess: () => {
        toast({ title: "Enquiry received!", description: "Our GST expert will call you within 2 hours." });
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
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">GST Services</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                GST Registration &<br />
                <span className="gradient-text">Return Filing Services</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">Fast, accurate and fully compliant GST services for individuals, businesses, MSMEs and startups across India. Get your GSTIN in 3–7 working days.</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[{ v: "3–7", l: "Days for GSTIN" }, { v: "₹0", l: "Hidden Charges" }, { v: "100%", l: "Online Process" }].map(s => (
                  <div key={s.l} className="text-center glass-card rounded-xl p-3">
                    <div className="text-2xl font-bold gradient-text">{s.v}</div>
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <a href="#enquiry"><Button size="lg" className="btn-gradient border-0 text-white">Get Started <ArrowRight size={18} className="ml-1" /></Button></a>
                <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer"><Button size="lg" variant="outline">WhatsApp Us</Button></a>
              </div>
            </div>
            {/* Lead Form */}
            <div id="enquiry" className="glass-card rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6">Get Free GST Consultation</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
                  <div className="space-y-1.5"><Label>Mobile *</Label><Input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="10-digit number" /></div>
                </div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>GST Service</Label>
                    <Select value={form.serviceRequired} onValueChange={v => setForm(p => ({ ...p, serviceRequired: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{gstServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Business Type</Label>
                    <Select value={form.businessType} onValueChange={v => setForm(p => ({ ...p, businessType: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{businessTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" /></div>
                <div className="space-y-1.5"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your GST requirement..." rows={3} /></div>
                <Button className="w-full btn-gradient border-0 text-white py-5" onClick={handleSubmit} disabled={createLead.isPending}>
                  {createLead.isPending ? "Submitting..." : "Submit Enquiry — Free Consultation"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Our GST expert will call you within 2 working hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Complete GST Services</h2>
            <p className="text-muted-foreground">From registration to annual compliance — we handle it all</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4"><Calculator size={20} className="text-blue-600" /></div>
                  <h3 className="font-bold text-lg mb-2 gradient-text">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{s.desc}</p>
                  <ul className="space-y-1.5">
                    {s.steps.map(step => <li key={step} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle size={12} className="text-primary shrink-0" />{step}</li>)}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why timely GST matters */}
      <section className="py-16 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-red-100 text-red-700 border-red-200"><AlertCircle size={12} className="mr-1" />Important</Badge>
            <h2 className="text-3xl font-bold mb-2">Why Timely GST Compliance Matters</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: <AlertCircle size={20} className="text-red-500" />, bg: "bg-red-50", title: "Penalties", desc: "Late filing attracts ₹50–₹200/day late fee plus interest @18% p.a." },
              { icon: <Shield size={20} className="text-blue-500" />, bg: "bg-blue-50", title: "ITC Benefits", desc: "Timely filing ensures uninterrupted Input Tax Credit for your business." },
              { icon: <FileText size={20} className="text-green-500" />, bg: "bg-green-50", title: "Loan Eligibility", desc: "Banks check GST compliance before approving business loans." },
              { icon: <Users size={20} className="text-purple-500" />, bg: "bg-purple-50", title: "Business Trust", desc: "Regular filers are preferred vendors/partners in B2B transactions." },
            ].map(item => (
              <div key={item.title} className={`${item.bg} rounded-2xl p-5 text-center`}>
                <div className="flex justify-center mb-3">{item.icon}</div>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Simple 4-step process — fully online</p>
          </div>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { n: "1", title: "Share Details", desc: "Fill the enquiry form or WhatsApp us with your requirement" },
              { n: "2", title: "Document Collection", desc: "We send you a checklist — you share documents digitally" },
              { n: "3", title: "Application Filing", desc: "Our expert prepares and files the application on your behalf" },
              { n: "4", title: "Done!", desc: "You receive the GSTIN / acknowledgement on email & WhatsApp" },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">{step.n}</div>
                <h4 className="font-semibold mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 btn-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get GST Registered Today</h2>
          <p className="text-white/80 mb-6">Free consultation • Expert filing • Real-time updates</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#enquiry"><Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">Start GST Registration <ArrowRight size={18} className="ml-1" /></Button></a>
            <a href="tel:01169310902"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Call: 01169310902</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
