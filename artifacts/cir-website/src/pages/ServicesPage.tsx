import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const services = [
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

const problems = [
  "Wrong Loan Showing in Report", "Duplicate Account Entries", "Written Off Status Not Updated",
  "Settled Status Issues", "Closed Account Not Updated", "Wrong Personal Information",
  "Low Credit Score Despite Good History", "Unknown Loan Entries", "Credit Card Reporting Errors",
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Our Services</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Complete Credit Health Solutions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From CIBIL rectification to comprehensive financial consultation — we cover every aspect of your credit health
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div key={service.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                  <h3 className="font-bold text-lg mb-2 gradient-text">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{service.desc}</p>
                  <ul className="space-y-1.5">
                    {service.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={14} className="text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-red-100 text-red-700 border-red-200">Problems We Solve</Badge>
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
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-white/80 mb-6">Get a free credit report analysis and find out exactly what needs to be fixed.</p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-primary border-0 hover:bg-white/90">
              Get Free Consultation <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
