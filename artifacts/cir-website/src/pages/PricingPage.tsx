import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";

const plans = [
  {
    name: "Basic Review", price: "₹999", duration: "one-time",
    desc: "Perfect for understanding your credit health",
    features: ["Credit Report Analysis", "Score Assessment", "Issue Identification", "Basic Recommendations", "Written Report", "1 Follow-up Call"],
    cta: "Get Basic Review",
  },
  {
    name: "Standard Consultation", price: "₹4,999", duration: "complete case",
    desc: "Full service with dispute filing and follow-up",
    features: ["Everything in Basic", "Dispute Letter Drafting", "Bureau Dispute Filing", "Document Assistance", "Progress Portal Access", "3 Month Follow-up", "Dedicated Executive", "WhatsApp Updates"],
    highlight: true,
    cta: "Get Standard Plan",
  },
  {
    name: "Premium Assistance", price: "Custom", duration: "complex cases",
    desc: "For complex multi-issue credit problems",
    features: ["Everything in Standard", "Multi-Bureau Disputes", "Priority Processing", "Legal Assistance", "Unlimited Follow-ups", "6 Month Support", "Guaranteed Resolution Attempts", "Executive Escalation"],
    cta: "Contact for Pricing",
  },
];

export default function PricingPage() {
  const [income, setIncome] = useState("");
  const [emi, setEmi] = useState("");

  const dti = income && emi ? ((parseFloat(emi) / parseFloat(income)) * 100).toFixed(1) : null;
  const borrowing = income && emi ? Math.max(0, (parseFloat(income) * 0.5 - parseFloat(emi)) * 60).toFixed(0) : null;

  const getDtiLabel = (d: string) => {
    const v = parseFloat(d);
    if (v < 30) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50" };
    if (v < 40) return { label: "Good", color: "text-blue-600", bg: "bg-blue-50" };
    if (v < 50) return { label: "Fair", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { label: "High Risk", color: "text-red-600", bg: "bg-red-50" };
  };

  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Transparent Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Honest Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">No hidden charges. No surprises. Pay only for what you need.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`rounded-2xl p-8 h-full flex flex-col relative ${plan.highlight ? "btn-gradient shadow-xl" : "glass-card"}`}>
                  {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm">Most Popular</div>}
                  <div className="mb-6">
                    <h3 className={`font-bold text-xl ${plan.highlight ? "text-white" : ""}`}>{plan.name}</h3>
                    <div className={`text-4xl font-bold mt-2 ${plan.highlight ? "text-white" : "gradient-text"}`}>{plan.price}</div>
                    <div className={`text-sm mt-1 ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.duration}</div>
                    <p className={`text-sm mt-2 ${plan.highlight ? "text-white/80" : "text-muted-foreground"}`}>{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-white/90" : ""}`}>
                        <CheckCircle size={15} className={plan.highlight ? "text-white" : "text-green-500"} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/contact">
                    <Button className={`w-full ${plan.highlight ? "bg-white text-primary hover:bg-white/90 border-0" : "btn-gradient border-0 text-white"}`}>
                      {plan.cta} <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DTI Calculator */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-accent/20 text-accent-foreground border-accent/30">Free Tool</Badge>
            <h2 className="text-3xl font-bold">Loan Eligibility Calculator</h2>
            <p className="text-muted-foreground mt-2">Calculate your Debt-to-Income (DTI) ratio and estimate how much loan you can get</p>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label>Monthly Income (₹)</Label>
                <Input data-testid="calc-income" type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="e.g. 50000" />
              </div>
              <div className="space-y-2">
                <Label>Existing Monthly EMIs (₹)</Label>
                <Input data-testid="calc-emi" type="number" value={emi} onChange={e => setEmi(e.target.value)} placeholder="e.g. 10000" />
              </div>
            </div>
            {dti && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className={`rounded-xl p-5 ${getDtiLabel(dti).bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Your DTI Ratio</span>
                    <span className={`text-2xl font-bold ${getDtiLabel(dti).color}`}>{dti}%</span>
                  </div>
                  <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-current transition-all" style={{ width: `${Math.min(parseFloat(dti), 100)}%`, color: getDtiLabel(dti).color.replace("text-", "") }} />
                  </div>
                  <div className={`text-sm mt-2 font-medium ${getDtiLabel(dti).color}`}>Status: {getDtiLabel(dti).label}</div>
                </div>
                {borrowing && (
                  <div className="stat-card rounded-xl p-5">
                    <div className="text-sm text-muted-foreground mb-1">Estimated Additional Borrowing Capacity</div>
                    <div className="text-3xl font-bold gradient-text">₹{parseInt(borrowing).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Based on 50% income threshold over 60 months</div>
                  </div>
                )}
                {parseFloat(dti) > 40 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
                    <p className="text-yellow-800 font-medium">Your DTI is high. Improving your credit score and reducing existing EMIs can significantly increase your loan eligibility. We can help!</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
