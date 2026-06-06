import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Calculator, Building2, Scale, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const creditServices = [
  { title: "CIBIL Rectification", desc: "Get incorrect entries in your CIBIL report corrected with proper documentation and formal dispute filing.", features: ["Identify incorrect entries", "Gather supporting documents", "File dispute with CIBIL", "Track resolution status"] },
  { title: "Credit Report Correction", desc: "Comprehensive correction of errors across all 4 major credit bureaus — CIBIL, Experian, CRIF, and Equifax.", features: ["Multi-bureau analysis", "Error identification", "Dispute across bureaus", "Confirmation of corrections"] },
  { title: "Score Improvement Guidance", desc: "Strategic guidance on improving your credit score through legitimate and sustainable methods.", features: ["Score analysis", "Personalized action plan", "Timeline estimation", "Progress monitoring"] },
  { title: "Written Off Account Rectification", desc: "Specialized assistance to address written-off accounts through proper settlement and NOC documentation.", features: ["Settlement negotiation guidance", "NOC acquisition support", "Bureau update filing", "Status verification"] },
  { title: "Settled Account Rectification", desc: "Convert settled account status to closed/paid after obtaining NOC from lenders.", features: ["Lender communication", "NOC request assistance", "Documentation preparation", "Bureau update"] },
  { title: "Closed Account Rectification", desc: "Ensure closed accounts are properly reflected in your credit report.", features: ["Account status verification", "Closure letter assistance", "Bureau dispute filing", "Update confirmation"] },
  { title: "Credit Profile Review", desc: "Comprehensive review of your credit profile with detailed insights and recommendations.", features: ["Full credit analysis", "Risk assessment", "Improvement roadmap", "Written report"] },
  { title: "Bank Dispute Assistance", desc: "Direct dispute assistance with banks for incorrect entries, unauthorized accounts, and wrong balances.", features: ["Bank communication", "Formal complaint filing", "Follow-up management", "Resolution tracking"] },
  { title: "NBFC Dispute Assistance", desc: "Handle disputes with Non-Banking Financial Companies for incorrect credit reporting.", features: ["NBFC identification", "Dispute preparation", "Communication support", "Resolution assistance"] },
  { title: "Documentation Assistance", desc: "Help gather and prepare all required documents for credit disputes and rectification.", features: ["Document checklist", "Collection guidance", "Notarization help", "File organization"] },
  { title: "Financial Consultation", desc: "Expert financial guidance on credit management, loan planning, and financial health improvement.", features: ["Credit counseling", "Loan eligibility guidance", "Financial planning", "Goal setting"] },
];

const gstTaxServices = [
  { title: "GST Registration", desc: "Get your GSTIN in 3–7 working days. We handle the complete application process.", features: ["Document preparation", "ARN generation", "GSTIN issuance", "Compliance setup"] },
  { title: "GST Return Filing", desc: "Timely and accurate filing of GSTR-1, GSTR-3B, GSTR-9 and other returns.", features: ["GSTR-1 & 3B filing", "ITC reconciliation", "2A/2B matching", "Annual return"] },
  { title: "GST Compliance & Notice", desc: "End-to-end compliance support, notice handling and audit assistance.", features: ["Notice reply drafting", "Audit support", "Cancellation services", "Amendment services"] },
  { title: "Individual ITR Filing", desc: "Salaried, pensioners and individuals — accurate ITR-1/2 filing before deadline.", features: ["Form 16 analysis", "Deduction optimisation", "Capital gains", "Advance tax guidance"] },
  { title: "Business ITR Filing", desc: "ITR-3 & ITR-4 for proprietors, professionals and small businesses.", features: ["P&L computation", "Depreciation", "Accounts reconciliation", "Digital signature"] },
  { title: "Tax Planning & Notice", desc: "Strategic tax planning and expert handling of income tax notices.", features: ["80C/80D planning", "HRA & LTA structuring", "Notice drafting", "Assessment support"] },
  { title: "PAN Card Services", desc: "New PAN application, correction of PAN details and Aadhaar linking.", features: ["New PAN", "PAN correction", "Aadhaar-PAN linking", "PAN surrender"] },
  { title: "TAN Registration", desc: "TAN registration for employers required to deduct TDS at source.", features: ["TAN application", "TDS guidance", "TDS return support", "TAN correction"] },
];

const businessRegServices = [
  { title: "Proprietorship Registration", desc: "Easiest way to start a business — get registered quickly with minimal documentation.", features: ["Trade name registration", "GST registration", "Bank account support", "Local licenses"] },
  { title: "Partnership Firm Registration", desc: "Register your partnership firm with a proper partnership deed.", features: ["Deed drafting", "Firm registration", "PAN for firm", "GST & bank account"] },
  { title: "LLP Registration", desc: "Limited Liability Partnership — perfect for professionals and service businesses.", features: ["Name reservation (RUN)", "LLP agreement", "Incorporation (FiLLiP)", "LLPIN certificate"] },
  { title: "Private Limited Company", desc: "Ideal for scalable startups and businesses seeking investment.", features: ["Name reservation", "DSC & DIN", "MOA & AOA", "Certificate of Incorporation"] },
  { title: "MSME / Udyam Registration", desc: "Get your Udyam certificate and unlock loans, subsidies and government benefits.", features: ["Eligibility check", "Udyam portal registration", "Certificate in 1–2 days", "Benefits guidance"] },
  { title: "Shop & Establishment", desc: "Mandatory local license for all commercial establishments.", features: ["Application preparation", "State portal filing", "License issuance", "Renewal support"] },
  { title: "Startup Registration", desc: "DPIIT recognition for eligible startups — tax benefits and scheme access.", features: ["Eligibility check", "DPIIT application", "Recognition certificate", "Scheme guidance"] },
  { title: "Import Export Code (IEC)", desc: "Mandatory DGFT registration for import/export businesses.", features: ["DGFT application", "IEC issuance", "Bank letter support", "Modification"] },
];

const legalServices = [
  { title: "Agreement Drafting", desc: "Professional drafting of business agreements, MoUs, vendor agreements and more.", features: ["Business agreements", "Partnership deeds", "NDA drafting", "Service agreements"] },
  { title: "Affidavit Drafting", desc: "Legally sound affidavits for personal, financial and property purposes.", features: ["Name change affidavit", "Income affidavit", "Residence proof", "Custom affidavits"] },
  { title: "Notary Documentation", desc: "Complete assistance in preparing and getting documents notarized.", features: ["Document preparation", "Notary guidance", "Power of Attorney", "Declarations"] },
  { title: "Digital Signature (DSC)", desc: "Class 2 and Class 3 DSC for MCA, GST, income tax and government portals.", features: ["Class 2 / 3 DSC", "MCA filings", "GST & ITR", "Tender submissions"] },
  { title: "Accounting & Bookkeeping", desc: "Professional bookkeeping and accounting support for all business sizes.", features: ["Monthly bookkeeping", "Bank reconciliation", "Accounts finalization", "MIS reports"] },
  { title: "Business Compliance", desc: "Annual compliance support for LLPs, companies and other entities.", features: ["Annual returns", "Board resolutions", "ROC filings", "Compliance calendar"] },
];

const problems = [
  "Wrong Loan Showing in Report", "Duplicate Account Entries", "Written Off Status Not Updated",
  "Settled Status Issues", "Closed Account Not Updated", "Wrong Personal Information",
  "Low Credit Score Despite Good History", "Unknown Loan Entries", "Credit Card Reporting Errors",
];

type Tab = "credit" | "gst-tax" | "business-reg" | "legal";

const tabs: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "credit", label: "Credit Services", icon: <ArrowRight size={16} />, color: "text-primary" },
  { id: "gst-tax", label: "Tax & GST", icon: <Calculator size={16} />, color: "text-blue-600" },
  { id: "business-reg", label: "Business Registration", icon: <Building2 size={16} />, color: "text-purple-600" },
  { id: "legal", label: "Legal & Compliance", icon: <Scale size={16} />, color: "text-orange-600" },
];

const serviceMap: Record<Tab, { title: string; desc: string; features: string[] }[]> = {
  credit: creditServices,
  "gst-tax": gstTaxServices,
  "business-reg": businessRegServices,
  legal: legalServices,
};

const learnMoreLinks: Record<Tab, { href: string; label: string }[]> = {
  credit: [{ href: "/contact", label: "Get Free Credit Consultation" }],
  "gst-tax": [
    { href: "/gst-services", label: "GST Services →" },
    { href: "/itr-filing", label: "ITR Filing →" },
  ],
  "business-reg": [
    { href: "/business-registration", label: "Business Registration →" },
    { href: "/msme-registration", label: "MSME Registration →" },
  ],
  legal: [{ href: "/legal-documentation", label: "Legal Documentation →" }],
};

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("credit");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Complete Service Platform</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            One Platform for All Your<br />
            <span className="gradient-text">Financial & Business Needs</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Credit report rectification, GST & income tax filing, business registration, legal documentation — 50+ services for individuals, professionals, MSMEs and startups.
          </p>
        </div>
      </section>

      {/* Quick Category Cards */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: "/services", tab: "credit" as Tab, icon: <ArrowRight size={22} className="text-primary" />, bg: "bg-primary/10", title: "Credit Services", count: "11 services" },
              { href: "/gst-services", tab: null, icon: <Calculator size={22} className="text-blue-600" />, bg: "bg-blue-50", title: "Tax & GST", count: "8 services" },
              { href: "/business-registration", tab: null, icon: <Building2 size={22} className="text-purple-600" />, bg: "bg-purple-50", title: "Business Registration", count: "8 services" },
              { href: "/legal-documentation", tab: null, icon: <Scale size={22} className="text-orange-600" />, bg: "bg-orange-50", title: "Legal & Compliance", count: "6 services" },
            ].map(cat => (
              <Link key={cat.title} href={cat.href} onClick={() => cat.tab && setActiveTab(cat.tab)}>
                <div className="glass-card rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-all cursor-pointer">
                  <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center`}>{cat.icon}</div>
                  <div>
                    <p className="font-semibold text-sm">{cat.title}</p>
                    <p className="text-xs text-muted-foreground">{cat.count}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tabbed Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab buttons */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                  activeTab === tab.id
                    ? "btn-gradient text-white border-transparent shadow-md"
                    : "bg-background border-border hover:border-primary/40 text-foreground/70 hover:text-foreground"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {serviceMap[activeTab].map((service, i) => (
              <motion.div key={service.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                  <h3 className="font-bold text-base mb-2 gradient-text">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{service.desc}</p>
                  <ul className="space-y-1.5">
                    {service.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle size={12} className="text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Explore dedicated pages */}
          {learnMoreLinks[activeTab].length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {learnMoreLinks[activeTab].map(link => (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" className="gap-2">{link.label}</Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Credit Problems (shown for credit tab context) */}
      <section className="py-16 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-red-100 text-red-700 border-red-200">Credit Problems We Solve</Badge>
            <h2 className="text-3xl font-bold">Common Credit Issues We Fix</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.map((p, i) => (
              <motion.div key={p} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="flex items-center gap-3 glass-card rounded-xl p-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <span className="text-red-600 text-xs font-bold">{i + 1}</span>
                  </div>
                  <span className="text-sm font-medium">{p}</span>
                  <CheckCircle size={14} className="text-green-500 ml-auto shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 btn-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Not Sure Which Service You Need?</h2>
          <p className="text-white/80 mb-6">Talk to our experts — free consultation for all services. We'll guide you to the right solution.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">
                Get Free Consultation <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                WhatsApp Us
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
