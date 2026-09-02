import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowRight, Receipt, AlertCircle, Shield, TrendingUp, Clock } from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const itrTypes = [
  { form: "ITR-1 (Sahaj)", for: "Salaried individuals, pension income, one house property. Income up to ₹50 lakh.", icon: "👤" },
  { form: "ITR-2", for: "Individuals & HUFs with capital gains, foreign income, multiple house properties.", icon: "🏠" },
  { form: "ITR-3", for: "Partners in a firm, professionals with business/profession income.", icon: "🤝" },
  { form: "ITR-4 (Sugam)", for: "Presumptive income under 44AD, 44ADA, 44AE. Ideal for small businesses & freelancers.", icon: "💼" },
];

const services = [
  { title: "Individual ITR Filing", desc: "Salaried, pensioners, and individuals with other income sources — accurate ITR-1/2 filing before deadline.", features: ["Form 16 analysis", "Deduction optimisation", "Capital gains computation", "Advance tax guidance"] },
  { title: "Business ITR Filing", desc: "ITR-3 & ITR-4 filing for proprietors, professionals, and small business owners with P&L and balance sheet.", features: ["Business income computation", "Depreciation schedules", "Accounts reconciliation", "Digital signature filing"] },
  { title: "Tax Planning Consultation", desc: "Strategic tax planning to legally minimise your tax liability through deductions, exemptions and investments.", features: ["80C/80D planning", "HRA & LTA structuring", "Investment guidance", "Future liability estimation"] },
  { title: "Tax Notice Assistance", desc: "Expert handling of income tax notices — scrutiny assessment, demand notices, and penalty proceedings.", features: ["Notice analysis", "Response drafting", "Faceless assessment support", "Department communication"] },
  { title: "PAN Card Services", desc: "New PAN application, correction of PAN details, and linking PAN with Aadhaar.", features: ["New PAN application", "PAN correction", "Aadhaar-PAN linking", "PAN surrender"] },
  { title: "TAN Registration", desc: "TAN registration for employers and businesses required to deduct TDS at source.", features: ["TAN application", "TDS compliance guidance", "TDS return support", "TAN correction"] },
];

const itrServices = ["Individual ITR Filing (ITR-1)", "Individual ITR Filing (ITR-2)", "Business ITR Filing (ITR-3/4)", "Tax Planning Consultation", "Tax Notice Reply", "PAN Card Services", "TAN Registration", "Other Tax Service"];
const businessTypes = ["Salaried Employee", "Freelancer / Consultant", "Business Owner", "Professional (Doctor/CA/Lawyer)", "Investor", "Partnership Firm", "Private Limited Company", "Other"];

export default function ITRFilingPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", city: "", serviceRequired: "", businessType: "", message: "" });
  const createLead = useCreateLead();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.name || !form.mobile) { toast({ title: "Please fill name and mobile", variant: "destructive" }); return; }
    createLead.mutate({ data: { ...form, source: "ITR_PAGE" } }, {
      onSuccess: () => {
        toast({ title: "Enquiry received!", description: "Our tax expert will contact you within 2 hours." });
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
              <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">Income Tax Services</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                ITR Filing &<br />
                <span className="gradient-text">Tax Consultation Services</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Accurate, timely and fully compliant Income Tax Return filing for salaried individuals, freelancers, businesses and professionals across India.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[{ v: "₹0", l: "Hidden Fee" }, { v: "24hr", l: "Turnaround" }, { v: "100%", l: "Accurate" }].map(s => (
                  <div key={s.l} className="text-center glass-card rounded-xl p-3">
                    <div className="text-2xl font-bold gradient-text">{s.v}</div>
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <a href="#enquiry"><Button size="lg" className="btn-gradient border-0 text-white">File ITR Now <ArrowRight size={18} className="ml-1" /></Button></a>
                <a href="https://wa.me/916900637638" target="_blank" rel="noopener noreferrer"><Button size="lg" variant="outline">WhatsApp Us</Button></a>
              </div>
            </div>
            {/* Lead Form */}
            <div id="enquiry" className="glass-card rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6">Get Free Tax Consultation</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
                  <div className="space-y-1.5"><Label>Mobile *</Label><Input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="10-digit number" /></div>
                </div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Service Required</Label>
                    <Select value={form.serviceRequired} onValueChange={v => setForm(p => ({ ...p, serviceRequired: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{itrServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Profile Type</Label>
                    <Select value={form.businessType} onValueChange={v => setForm(p => ({ ...p, businessType: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{businessTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" /></div>
                <div className="space-y-1.5"><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Any specific details about your tax situation..." rows={3} /></div>
                <Button className="w-full btn-gradient border-0 text-white py-5" onClick={handleSubmit} disabled={createLead.isPending}>
                  {createLead.isPending ? "Submitting..." : "Submit — Our Expert Will Call You"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ITR Types */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Which ITR Form Do You Need?</h2>
            <p className="text-muted-foreground">Our experts will guide you to the correct form based on your income sources</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {itrTypes.map((itr, i) => (
              <motion.div key={itr.form} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="glass-card rounded-2xl p-5 h-full">
                  <div className="text-3xl mb-3">{itr.icon}</div>
                  <h3 className="font-bold text-base mb-2 gradient-text">{itr.form}</h3>
                  <p className="text-sm text-muted-foreground">{itr.for}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">All Tax Services</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4"><Receipt size={20} className="text-green-600" /></div>
                  <h3 className="font-bold text-lg mb-2 gradient-text">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{s.desc}</p>
                  <ul className="space-y-1.5">{s.features.map(f => <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle size={12} className="text-primary shrink-0" />{f}</li>)}</ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Consequences of not filing */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-red-100 text-red-700 border-red-200"><AlertCircle size={12} className="mr-1" />Don't Miss the Deadline</Badge>
            <h2 className="text-3xl font-bold mb-2">Consequences of Not Filing ITR</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <AlertCircle className="text-red-500" />, bg: "bg-red-50", title: "Penalty up to ₹5,000", desc: "Late filing penalty under Section 234F" },
              { icon: <TrendingUp className="text-orange-500" />, bg: "bg-orange-50", title: "Interest @1% per month", desc: "On tax due under Section 234A" },
              { icon: <Shield className="text-blue-500" />, bg: "bg-blue-50", title: "Loan Rejection", desc: "Banks & NBFCs require ITR for loan approvals" },
              { icon: <Clock className="text-purple-500" />, bg: "bg-purple-50", title: "Notice from IT Dept", desc: "Non-filers receive notices under Section 148" },
            ].map(item => (
              <div key={item.title} className={`${item.bg} rounded-2xl p-5 text-center`}>
                <div className="flex justify-center mb-3">{item.icon}</div>
                <h4 className="font-bold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 btn-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">File Your ITR Today — Hassle Free</h2>
          <p className="text-white/80 mb-6">Expert filing • Maximum refund • On-time submission</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#enquiry"><Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">Get Started <ArrowRight size={18} className="ml-1" /></Button></a>
            <a href="tel:01169296558"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Call: 01169296558</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
