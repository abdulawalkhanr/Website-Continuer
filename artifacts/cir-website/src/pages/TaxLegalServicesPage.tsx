import { motion } from "framer-motion";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Building2, Scale, Calculator, ArrowRight, CheckCircle,
  Users, TrendingUp, Shield, Briefcase, Receipt, ClipboardList,
} from "lucide-react";

const categories = [
  {
    icon: <Calculator size={28} className="text-blue-600" />,
    bg: "bg-blue-50",
    title: "GST Services",
    href: "/gst-services",
    badge: "Most Popular",
    badgeColor: "bg-blue-100 text-blue-700",
    services: [
      "GST Registration",
      "GST Return Filing",
      "GST Compliance Assistance",
      "GST Amendment Services",
      "GST Cancellation Services",
    ],
  },
  {
    icon: <Receipt size={28} className="text-green-600" />,
    bg: "bg-green-50",
    title: "Income Tax Services",
    href: "/itr-filing",
    badge: "High Demand",
    badgeColor: "bg-green-100 text-green-700",
    services: [
      "Individual ITR Filing",
      "Business ITR Filing",
      "Tax Planning Consultation",
      "Tax Notice Assistance",
      "PAN Card & TAN Services",
    ],
  },
  {
    icon: <Building2 size={28} className="text-purple-600" />,
    bg: "bg-purple-50",
    title: "Business Registration",
    href: "/business-registration",
    badge: "Startup Ready",
    badgeColor: "bg-purple-100 text-purple-700",
    services: [
      "MSME / Udyam Registration",
      "Proprietorship Registration",
      "Partnership Registration",
      "LLP Registration",
      "Private Limited Company",
    ],
  },
  {
    icon: <Scale size={28} className="text-orange-600" />,
    bg: "bg-orange-50",
    title: "Legal Documentation",
    href: "/legal-documentation",
    badge: "Trusted",
    badgeColor: "bg-orange-100 text-orange-700",
    services: [
      "Agreement Drafting",
      "Affidavit Drafting",
      "Notary Documentation",
      "Business Documentation",
      "Digital Signature (DSC)",
    ],
  },
];

const allServices = [
  { cat: "GST", icon: <Calculator size={16} />, color: "text-blue-600", bg: "bg-blue-50", items: ["GST Registration", "GST Return Filing (GSTR-1, 3B, 9)", "GST Compliance Assistance", "GST Amendment Services", "GST Cancellation / Surrender", "GST Annual Return"] },
  { cat: "Income Tax", icon: <Receipt size={16} />, color: "text-green-600", bg: "bg-green-50", items: ["Individual ITR Filing (ITR-1 to ITR-4)", "Business ITR Filing", "Tax Planning Consultation", "Tax Notice Assistance & Reply", "PAN Card Services & Correction", "TAN Registration"] },
  { cat: "Business Registration", icon: <Building2 size={16} />, color: "text-purple-600", bg: "bg-purple-50", items: ["MSME / Udyam Registration", "Shop & Establishment Registration", "Trade License Assistance", "Proprietorship Registration", "Partnership Registration", "LLP Registration Assistance", "Pvt Ltd Company Registration", "Startup Registration", "Professional Tax Registration"] },
  { cat: "Compliance & Other", icon: <ClipboardList size={16} />, color: "text-teal-600", bg: "bg-teal-50", items: ["Import Export Code (IEC) Registration", "Digital Signature Certificate (DSC)", "Accounting & Bookkeeping Support", "Business Compliance Assistance", "Agreement Drafting", "Affidavit & Notary Documentation", "Legal Documentation Support"] },
];

const audiences = [
  { icon: <Users size={20} />, label: "Individual Taxpayers" },
  { icon: <Briefcase size={20} />, label: "Small Business Owners" },
  { icon: <Building2 size={20} />, label: "MSME Businesses" },
  { icon: <TrendingUp size={20} />, label: "Startups" },
  { icon: <Shield size={20} />, label: "Traders & Professionals" },
  { icon: <FileText size={20} />, label: "Freelancers & Self-Employed" },
  { icon: <Scale size={20} />, label: "Partnership Firms" },
  { icon: <Building2 size={20} />, label: "Private Limited Companies" },
];

export default function TaxLegalServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">Tax & Legal Services</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Business Registration, Taxation &{" "}
              <span className="gradient-text">Compliance Solutions</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Professional assistance for GST, Income Tax, Business Registration, Compliance and Documentation Services — all under one roof.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="btn-gradient border-0 text-white gap-2">
                  Get Free Consultation <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="https://wa.me/916900637638" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  WhatsApp Us Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Our Tax & Legal Service Categories</h2>
            <p className="text-muted-foreground">Choose the service area that fits your need</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href={cat.href}>
                  <div className="glass-card rounded-2xl p-6 h-full flex flex-col hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-primary/20">
                    <div className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center mb-4`}>
                      {cat.icon}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-bold text-lg">{cat.title}</h3>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.badgeColor} w-fit mb-4`}>{cat.badge}</span>
                    <ul className="space-y-2 flex-1">
                      {cat.services.map(s => (
                        <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle size={13} className="text-primary shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Explore <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Service List */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Complete List</Badge>
            <h2 className="text-3xl font-bold mb-3">All Tax & Legal Services</h2>
            <p className="text-muted-foreground">35+ services across GST, Tax, Business Registration and Legal Assistance</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allServices.map((group, i) => (
              <motion.div key={group.cat} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className={`flex items-center gap-2 mb-4 font-bold ${group.color}`}>
                    <span className={`p-1.5 rounded-lg ${group.bg}`}>{group.icon}</span>
                    {group.cat}
                  </div>
                  <ul className="space-y-2">
                    {group.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle size={13} className="text-primary shrink-0 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Benefit */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-green-100 text-green-700 border-green-200">Who We Serve</Badge>
            <h2 className="text-3xl font-bold mb-3">Who Can Benefit?</h2>
            <p className="text-muted-foreground">Our tax and legal services are designed for everyone — from individuals to enterprises</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {audiences.map((a, i) => (
              <motion.div key={a.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="glass-card rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                    {a.icon}
                  </div>
                  <p className="text-sm font-medium">{a.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CIR */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Choose CIR for Tax & Legal Services?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Users size={24} />, title: "Expert Team", desc: "Experienced tax consultants and legal professionals with deep knowledge of Indian tax laws and compliance requirements." },
              { icon: <Shield size={24} />, title: "100% Compliant", desc: "All filings and registrations done strictly as per government guidelines — no shortcuts, no risk to your business." },
              { icon: <TrendingUp size={24} />, title: "End-to-End Support", desc: "From initial consultation to final submission — we handle everything so you can focus on your business." },
              { icon: <CheckCircle size={24} />, title: "Affordable Pricing", desc: "Transparent, competitive pricing with no hidden charges. Plans for individuals, MSMEs, and large businesses." },
              { icon: <FileText size={24} />, title: "Digital Process", desc: "Fully paperless process with secure document handling and real-time status updates via your dashboard." },
              { icon: <Scale size={24} />, title: "One-Stop Platform", desc: "Credit, Tax, GST, Business Registration, and Legal services — all from one trusted company." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-2xl p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
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
          <h2 className="text-3xl font-bold text-white mb-4">Start Your Tax & Legal Journey Today</h2>
          <p className="text-white/80 mb-8">Get a free consultation with our experts. We'll help you choose the right service and get started immediately.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">
                Book Free Consultation <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <a href="tel:01169296558">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Call 01169296558
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
