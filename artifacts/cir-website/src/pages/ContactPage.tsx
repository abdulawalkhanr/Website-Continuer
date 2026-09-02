import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageCircle, Mail, Globe, MapPin } from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const ALL_SERVICES = [
  // Credit Services
  { group: "── Credit Services ──", items: [
    "CIBIL Rectification",
    "Credit Report Correction",
    "Score Improvement",
    "Written Off Account",
    "Settled Account Rectification",
    "Bank / NBFC Dispute Assistance",
    "Credit Profile Review",
    "Financial Consultation",
  ]},
  // Tax & GST
  { group: "── Tax & GST Services ──", items: [
    "GST Registration",
    "GST Return Filing",
    "GST Compliance & Notice",
    "GST Amendment / Cancellation",
    "Individual ITR Filing",
    "Business ITR Filing",
    "Tax Planning Consultation",
    "Tax Notice Assistance",
    "PAN Card Services",
    "TAN Registration",
  ]},
  // Business Registration
  { group: "── Business Registration ──", items: [
    "Proprietorship Registration",
    "Partnership Firm Registration",
    "LLP Registration",
    "Private Limited Company Registration",
    "MSME / Udyam Registration",
    "Shop & Establishment Registration",
    "Trade License",
    "Startup / DPIIT Registration",
    "Professional Tax Registration",
    "Import Export Code (IEC)",
  ]},
  // Legal
  { group: "── Legal & Compliance ──", items: [
    "Agreement Drafting",
    "Affidavit Drafting",
    "Notary Documentation",
    "Digital Signature Certificate (DSC)",
    "Accounting & Bookkeeping",
    "Business Compliance",
    "Other / Not Sure",
  ]},
];

const BUSINESS_TYPES = [
  "Individual / Salaried",
  "Freelancer / Consultant",
  "Sole Proprietor",
  "Partnership Firm",
  "LLP",
  "Private Limited Company",
  "MSME / Small Business",
  "Startup",
  "Trader",
  "Professional (Doctor/CA/Lawyer)",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", city: "", serviceRequired: "", businessType: "", message: "" });
  const createLead = useCreateLead();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.name || !form.mobile) {
      toast({ title: "Please fill name and mobile", variant: "destructive" });
      return;
    }
    createLead.mutate({ data: { ...form, source: "CONTACT" } }, {
      onSuccess: () => {
        toast({ title: "Message sent!", description: "We will get back to you within 24 hours." });
        setForm({ name: "", mobile: "", email: "", city: "", serviceRequired: "", businessType: "", message: "" });
      },
    });
  };

  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Get In Touch</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground">Credit, Tax, Business or Legal — we're here to help with everything.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Reach Us Directly</h2>
            <div className="space-y-6">
              {[
                { icon: <Phone size={22} className="text-primary" />, label: "Customer Support", value: "01169296558", href: "tel:01169296558", bg: "bg-primary/10" },
                { icon: <MessageCircle size={22} className="text-green-600" />, label: "WhatsApp Support", value: "+91 6900637638", href: "https://wa.me/916900637638", bg: "bg-green-50" },
                { icon: <Mail size={22} className="text-purple-600" />, label: "Email", value: "support@circonsultationservice.in", href: "mailto:support@circonsultationservice.in", bg: "bg-purple-50" },
                { icon: <Globe size={22} className="text-blue-600" />, label: "Website", value: "circonsultationservice.in", href: "https://circonsultationservice.in", bg: "bg-blue-50" },
              ].map(item => (
                <motion.a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-4 glass-card rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>{item.icon}</div>
                  <div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="font-semibold group-hover:text-primary transition-colors">{item.value}</div>
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="mt-8 glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-primary" />
                <span className="font-semibold">Office Hours</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Monday – Saturday: 9:00 AM – 7:00 PM</p>
                <p>Sunday: 10:00 AM – 4:00 PM</p>
                <p className="text-primary font-medium mt-2">WhatsApp available 24/7</p>
              </div>
            </div>

            {/* Services we cover */}
            <div className="mt-6 glass-card rounded-xl p-6">
              <p className="font-semibold mb-3 text-sm">We cover enquiries for:</p>
              <div className="flex flex-wrap gap-2">
                {["Credit Repair", "CIBIL Dispute", "GST Registration", "ITR Filing", "Business Registration", "MSME / Udyam", "LLP / Pvt Ltd", "Legal Docs", "Agreement Drafting"].map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-primary/8 text-primary rounded-full border border-primary/15">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Send a Message</h2>
            <div className="glass-card rounded-2xl p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input data-testid="contact-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile *</Label>
                  <Input data-testid="contact-mobile" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile number" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input data-testid="contact-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input data-testid="contact-city" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" />
                </div>
                <div className="space-y-2">
                  <Label>Business / Profile Type</Label>
                  <Select value={form.businessType} onValueChange={v => setForm(p => ({ ...p, businessType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Service Required</Label>
                <Select value={form.serviceRequired} onValueChange={v => setForm(p => ({ ...p, serviceRequired: v }))}>
                  <SelectTrigger data-testid="contact-service"><SelectValue placeholder="What can we help with?" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ALL_SERVICES.map(group => (
                      <div key={group.group}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">{group.group}</div>
                        {group.items.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea data-testid="contact-message" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your requirement in brief..." rows={4} />
              </div>

              <Button className="w-full btn-gradient border-0 text-white py-6 text-base" onClick={handleSubmit} disabled={createLead.isPending} data-testid="contact-submit">
                {createLead.isPending ? "Sending..." : "Send Message — We'll Call You Back"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">We respond within 24 hours on all working days</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
