import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const steps = [
  {
    num: "01", title: "Share Credit Report", color: "bg-blue-500",
    desc: "Submit your latest credit report from any bureau (CIBIL, Experian, CRIF, or Equifax). Our team performs an initial review within 24 hours.",
    items: ["Download credit report from bureau", "Share securely via portal or WhatsApp", "Initial review by our expert team"],
  },
  {
    num: "02", title: "Case Evaluation", color: "bg-purple-500",
    desc: "Our credit experts conduct a detailed analysis of your report, identifying all errors, incorrect entries, and disputable items.",
    items: ["Detailed report analysis", "Issue identification", "Strategy formulation", "Case assessment report"],
  },
  {
    num: "03", title: "Documentation Review", color: "bg-pink-500",
    desc: "We provide you with a precise checklist of documents needed to support your dispute and guide you through collecting them.",
    items: ["Document checklist provided", "Collection guidance", "Document verification", "Secure upload to portal"],
  },
  {
    num: "04", title: "Verification", color: "bg-orange-500",
    desc: "All documents and claim details are verified thoroughly before filing to maximize chances of successful dispute resolution.",
    items: ["Identity verification", "Document authenticity check", "Claim validation", "Dispute preparation"],
  },
  {
    num: "05", title: "Dispute Filed", color: "bg-primary",
    desc: "Formal dispute is submitted to the concerned credit bureau and lender with all supporting documentation.",
    items: ["Dispute letter prepared", "Filed with bureau/lender", "Case ID generated", "Acknowledgment received"],
  },
  {
    num: "06", title: "Follow Up", color: "bg-teal-500",
    desc: "We actively follow up with bureaus and lenders, escalating when necessary to ensure your case doesn't fall through the cracks.",
    items: ["Regular status checks", "Escalation if needed", "Updates to customer", "Response handling"],
  },
  {
    num: "07", title: "Resolution", color: "bg-green-500",
    desc: "Once the bureau/lender confirms the correction, we verify the updated credit report and ensure your score reflects the changes.",
    items: ["Correction confirmation", "Updated report verification", "Score impact check", "Final report provided"],
  },
];

export default function ProcessPage() {
  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Our Process</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">How We Resolve Your Credit Issues</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A transparent, step-by-step process designed to maximize your chances of successful credit rectification</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-accent hidden md:block" />
            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div key={step.num} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-6 relative">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg z-10`}>{step.num}</div>
                  <div className="glass-card rounded-2xl p-6 flex-1">
                    <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4 text-sm">{step.desc}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {step.items.map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle size={14} className="text-green-500 shrink-0" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 section-bg-alt">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Expected Timeline</h2>
          <div className="grid grid-cols-3 gap-6 mt-8">
            {[
              { time: "24-48 hrs", label: "Initial Assessment" },
              { time: "7-15 days", label: "Documentation" },
              { time: "30-90 days", label: "Full Resolution" },
            ].map(item => (
              <div key={item.label} className="glass-card rounded-2xl p-6 text-center">
                <div className="text-2xl font-bold gradient-text mb-2">{item.time}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/contact">
              <Button size="lg" className="btn-gradient border-0 text-white px-8">
                Start Your Case Today <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
