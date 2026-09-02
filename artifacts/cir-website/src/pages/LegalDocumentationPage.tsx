import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowRight, Scale, FileText, Shield, Clock, Users, BookOpen } from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const services = [
  { icon: <FileText size={20} className="text-blue-600" />, bg: "bg-blue-50", title: "Agreement Drafting", desc: "Professional drafting of business agreements, partnership deeds, MoUs, vendor agreements, service agreements and more.", items: ["Business agreements", "Partnership deeds", "MOU / MOA drafting", "Vendor & service agreements", "Employment agreements", "Non-disclosure agreements (NDA)"] },
  { icon: <BookOpen size={20} className="text-purple-600" />, bg: "bg-purple-50", title: "Affidavit Drafting", desc: "Legally sound affidavits for personal, financial, property and name change purposes.", items: ["Name change affidavit", "Income affidavit", "Residence affidavit", "Asset declaration", "Relationship affidavit", "Custom affidavits"] },
  { icon: <Scale size={20} className="text-green-600" />, bg: "bg-green-50", title: "Notary Documentation", desc: "Assistance in getting documents notarized — we prepare everything and guide you through the notary process.", items: ["Document preparation", "Notary appointment guidance", "Power of Attorney", "Declarations & undertakings", "Property documents", "Educational certificates"] },
  { icon: <Shield size={20} className="text-orange-600" />, bg: "bg-orange-50", title: "Business Documentation", desc: "Complete business document support — from incorporation to operational documents.", items: ["Founders' agreement", "Shareholder agreement", "Board resolutions", "Loan agreements", "Lease agreements", "Policy & procedure manuals"] },
  { icon: <Users size={20} className="text-teal-600" />, bg: "bg-teal-50", title: "Digital Signature (DSC)", desc: "Class 2 and Class 3 Digital Signature Certificates for all government portal filings.", items: ["Class 2 DSC", "Class 3 DSC", "MCA / ROC filings", "GST & income tax", "Tender submissions", "EPFO & ESIC"] },
  { icon: <Clock size={20} className="text-pink-600" />, bg: "bg-pink-50", title: "Accounting & Bookkeeping", desc: "Professional bookkeeping and accounting support for businesses of all sizes.", items: ["Monthly bookkeeping", "Tally / Zoho accounting", "Bank reconciliation", "Accounts finalization", "MIS reports", "Payroll support"] },
];

const legalServices = ["Agreement Drafting", "Affidavit Drafting", "Notary Documentation", "Business Documentation", "Digital Signature (DSC)", "Accounting & Bookkeeping", "Power of Attorney", "Other Legal Service"];
const businessTypes = ["Individual", "Sole Proprietor", "Partnership Firm", "LLP", "Private Limited Company", "Trust / Society", "Other"];

export default function LegalDocumentationPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", city: "", serviceRequired: "", businessType: "", message: "" });
  const createLead = useCreateLead();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.name || !form.mobile) { toast({ title: "Please fill name and mobile", variant: "destructive" }); return; }
    createLead.mutate({ data: { ...form, source: "LEGAL_PAGE" } }, {
      onSuccess: () => {
        toast({ title: "Enquiry received!", description: "Our legal documentation expert will contact you within 2 hours." });
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
              <Badge className="mb-4 bg-orange-100 text-orange-700 border-orange-200">Legal Documentation</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Legal Documentation &<br />
                <span className="gradient-text">Agreement Services</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Professional drafting of agreements, affidavits, notary documents and business documentation — protecting your interests with legally sound paperwork.
              </p>
              <div className="space-y-3 mb-8">
                {["Professionally drafted by experts familiar with Indian law", "Quick turnaround — most documents in 24–48 hours", "Fully customised to your specific requirements"].map(b => (
                  <div key={b} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-primary shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <a href="#enquiry"><Button size="lg" className="btn-gradient border-0 text-white">Get Document Drafted <ArrowRight size={18} className="ml-1" /></Button></a>
                <a href="https://wa.me/916900637638" target="_blank" rel="noopener noreferrer"><Button size="lg" variant="outline">WhatsApp Us</Button></a>
              </div>
            </div>
            {/* Lead Form */}
            <div id="enquiry" className="glass-card rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6">Get Free Legal Consultation</h3>
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
                      <SelectContent>{legalServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Applicant Type</Label>
                    <Select value={form.businessType} onValueChange={v => setForm(p => ({ ...p, businessType: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{businessTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" /></div>
                <div className="space-y-1.5"><Label>Describe Your Requirement *</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="What document do you need and for what purpose?" rows={4} /></div>
                <Button className="w-full btn-gradient border-0 text-white py-5" onClick={handleSubmit} disabled={createLead.isPending}>
                  {createLead.isPending ? "Submitting..." : "Submit Requirement"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Legal Documentation Services</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>{s.icon}</div>
                  <h3 className="font-bold text-lg mb-2 gradient-text">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{s.desc}</p>
                  <ul className="space-y-1.5">{s.items.map(item => <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle size={11} className="text-primary shrink-0" />{item}</li>)}</ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why proper documentation matters */}
      <section className="py-16 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Why Proper Documentation Matters</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "⚖️", title: "Legal Protection", desc: "Properly drafted agreements protect you in case of disputes and are enforceable in Indian courts." },
              { icon: "🏦", title: "Bank & Lender Trust", desc: "Banks require proper documentation for loans, overdrafts and business accounts." },
              { icon: "🤝", title: "Business Credibility", desc: "Professional documentation builds trust with partners, vendors and clients." },
              { icon: "📋", title: "Compliance Ready", desc: "Proper records ensure smooth government inspections, audits and regulatory compliance." },
            ].map(item => (
              <div key={item.title} className="glass-card rounded-2xl p-5 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 btn-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get Your Documents Drafted Today</h2>
          <p className="text-white/80 mb-6">Expert drafting • 24–48 hour turnaround • 100% customised</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#enquiry"><Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">Start Now <ArrowRight size={18} className="ml-1" /></Button></a>
            <a href="tel:01169296558"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Call: 01169296558</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
