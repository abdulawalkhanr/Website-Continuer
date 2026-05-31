import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, TrendingUp, Shield, Phone, MessageCircle, ArrowRight, Star, Users, Award, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditScoreGauge } from "@/components/CreditScoreGauge";
import { useCreateLead } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const count = useCountUp(value);
  return (
    <div className="text-center">
      <div className="text-4xl font-bold gradient-text">{count.toLocaleString()}{suffix}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

const FAQS = [
  { q: "What is CIBIL score and why does it matter?", a: "CIBIL score is a 3-digit number (300–900) that reflects your creditworthiness. Lenders use it to decide whether to approve loans and credit cards. A score above 750 is considered excellent." },
  { q: "How long does it take to rectify a credit report?", a: "Typically 30–90 days depending on the complexity of the issue and the responsiveness of banks and bureaus. We guide you through every step." },
  { q: "Can a written-off account be removed from my CIBIL report?", a: "Yes. With proper documentation and dispute assistance, written-off accounts can be rectified or updated to reflect the correct status once settlement is completed." },
  { q: "What documents are required to start the process?", a: "You need your PAN card, Aadhaar card, latest credit report, and any relevant bank documents (NOC, closure letter, settlement letter)." },
  { q: "Is my personal information kept confidential?", a: "Absolutely. All your data is handled with strict confidentiality. We never share your information with third parties without consent." },
  { q: "Do you guarantee credit score improvement?", a: "We provide professional consultation and dispute assistance. While outcomes depend on bureau and lender responses, our process maximizes the chances of successful rectification." },
  { q: "What is the difference between dispute and rectification?", a: "Dispute is the formal process of challenging incorrect entries. Rectification is the outcome — correcting wrong information. We assist with both." },
  { q: "How do I track my case progress?", a: "Once your case is registered, you receive a unique Case ID. You can track real-time progress through our Customer Portal or by contacting our support team." },
  { q: "Do you handle both CIBIL and other bureau reports?", a: "Yes. We assist with reports from CIBIL (TransUnion), Experian, CRIF High Mark, and Equifax." },
  { q: "What is a settled account and can it be fixed?", a: "A settled account means you paid less than the full amount owed. This negatively impacts your score. We help initiate NOC requests and dispute incorrect settled markings." },
  { q: "Can I get a loan after credit rectification?", a: "Yes. Once your credit report is corrected and score improves, your loan eligibility improves significantly. We also provide guidance on the right time to apply." },
  { q: "What services does CIR Consultation offer?", a: "We offer CIBIL rectification, credit report correction, score improvement guidance, dispute assistance, written-off/settled/closed account rectification, and financial consultation." },
  { q: "What is the pricing for your services?", a: "We offer Basic Review at ₹999, Standard Consultation at ₹4,999, and Premium Assistance at custom pricing based on case complexity." },
  { q: "How does the referral program work?", a: "Refer a friend or colleague who needs credit assistance. When their case is converted, you earn ₹1,000 to ₹3,000 as referral reward, transferred directly to your bank account." },
  { q: "How do I submit a support ticket?", a: "Log into your Customer Portal, navigate to Support Tickets, and create a new ticket describing your issue. Our team responds within 24 hours." },
  { q: "What if the bureau rejects my dispute?", a: "We analyse the rejection reason, gather additional evidence, and re-submit the dispute with stronger documentation. Persistence and proper documentation are key." },
  { q: "Can you help with unknown loan entries in my credit report?", a: "Yes. Unknown loan entries are often due to identity theft or data errors. We help you raise disputes with the concerned lender and credit bureau to get them removed." },
  { q: "How do I contact CIR Consultation Service?", a: "Call us at 01169310902, WhatsApp at +91 9864920810, or email support@circonsultationservice.site. We're available Mon–Sat, 9 AM–7 PM." },
  { q: "Is there an online customer portal?", a: "Yes. After registration, you get access to our Customer Portal where you can track case progress, upload documents, view payments, and raise support tickets." },
  { q: "What happens if my credit issue is not resolved?", a: "We review your case thoroughly, try alternative dispute approaches, and if the issue is genuinely unresolvable (e.g., correct negative information), we guide you on a credit rebuilding strategy." },
];

export default function HomePage() {
  const [consultOpen, setConsultOpen] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", email: "", city: "", serviceRequired: "" });
  const createLead = useCreateLead();
  const { toast } = useToast();

  const handleConsult = () => {
    if (!form.name || !form.mobile) {
      toast({ title: "Please fill name and mobile number", variant: "destructive" });
      return;
    }
    createLead.mutate({ data: { ...form, source: "HOMEPAGE" } }, {
      onSuccess: () => {
        toast({ title: "Request submitted!", description: "Our team will contact you within 24 hours." });
        setConsultOpen(false);
        setForm({ name: "", mobile: "", email: "", city: "", serviceRequired: "" });
      },
    });
  };

  const whoWeHelp = [
    { icon: "👔", title: "Salaried Employees", desc: "Fix credit issues affecting your loan approvals" },
    { icon: "🏢", title: "Business Owners", desc: "Improve business credit profile for better financing" },
    { icon: "💼", title: "Self Employed", desc: "Professional credit guidance for freelancers" },
    { icon: "🏠", title: "Loan Applicants", desc: "Clear disputes before applying for home/car loans" },
    { icon: "💳", title: "Credit Card Holders", desc: "Resolve wrong credit card reporting errors" },
    { icon: "⚠️", title: "Credit Issues", desc: "Anyone facing unknown entries or low scores" },
  ];

  const whyUs = [
    { icon: <Award size={24} />, title: "Professional Service", desc: "Certified credit consultants with deep bureau expertise" },
    { icon: <Shield size={24} />, title: "Transparent Process", desc: "Regular updates at every step — no hidden charges" },
    { icon: <Users size={24} />, title: "Dedicated Support", desc: "Personal executive assigned to every case" },
    { icon: <Shield size={24} />, title: "Confidential Handling", desc: "Your data is encrypted and never shared" },
    { icon: <Clock size={24} />, title: "Regular Updates", desc: "WhatsApp and email updates on case progress" },
    { icon: <Star size={24} />, title: "Customer Focused", desc: "We measure success by your credit improvement" },
  ];

  const services = [
    "CIBIL Rectification", "Credit Report Correction", "Score Improvement Guidance",
    "Written Off Account", "Settled Account Rectification", "Dispute Assistance",
    "Profile Review", "Documentation Support",
  ];

  const processSteps = [
    { num: "01", title: "Share Credit Report", desc: "Share your latest credit report for analysis" },
    { num: "02", title: "Case Evaluation", desc: "Our experts evaluate your credit issues" },
    { num: "03", title: "Documentation", desc: "Gather required documents for dispute" },
    { num: "04", title: "Verification", desc: "Verify all information before submission" },
    { num: "05", title: "Dispute Filed", desc: "Formal dispute submitted to bureau/lender" },
    { num: "06", title: "Follow Up", desc: "Regular follow-up until resolution" },
    { num: "07", title: "Resolution", desc: "Credit report updated and score improves" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="hero-bg min-h-screen flex items-center relative overflow-hidden py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              Trusted by 2,000+ Customers Across India
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Resolve Credit Issues{" "}
              <span className="gradient-text">With Confidence</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
              Professional Credit Consultation, Credit Report Rectification, Credit Score Guidance, Credit Profile Review and Dispute Assistance for Individuals and Businesses.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Button size="lg" className="btn-gradient border-0 text-white px-8 shadow-md" onClick={() => setConsultOpen(true)} data-testid="btn-free-consultation">
                Get Free Consultation <ArrowRight size={18} className="ml-2" />
              </Button>
              <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" data-testid="btn-whatsapp">
                  <MessageCircle size={18} className="mr-2" /> WhatsApp Us
                </Button>
              </a>
              <a href="tel:01169310902">
                <Button size="lg" variant="outline" data-testid="btn-call">
                  <Phone size={18} className="mr-2" /> Call Now
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {["CIBIL Rectification", "Dispute Assistance", "Score Improvement"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-green-500" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col items-center gap-6">
            <div className="glass-card rounded-3xl p-8 w-full max-w-sm">
              <h3 className="text-center font-semibold text-foreground mb-2">Credit Score Improvement</h3>
              <CreditScoreGauge />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-500">490</div>
                  <div className="text-xs text-muted-foreground">Before</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">782</div>
                  <div className="text-xs text-muted-foreground">After CIR</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
              {[
                { icon: <TrendingUp size={18} className="text-primary" />, label: "Score Improved" },
                { icon: <Shield size={18} className="text-accent" />, label: "Disputes Won" },
                { icon: <CheckCircle size={18} className="text-green-500" />, label: "Reports Fixed" },
              ].map(item => (
                <div key={item.label} className="glass-card rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">{item.icon}</div>
                  <div className="text-xs font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <a href="#stats" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground">
          <ChevronDown size={24} />
        </a>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={2000} suffix="+" label="Satisfied Customers" />
          <StatCounter value={850} suffix="+" label="Cases Resolved" />
          <StatCounter value={95} suffix="%" label="Success Rate" />
          <StatCounter value={150} suffix="+" label="Avg Score Jump" />
        </div>
      </section>

      {/* Who We Help */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge className="mb-3 bg-secondary/50 text-secondary-foreground border-secondary/30">Who We Help</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">We Help Everyone with Credit Issues</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {whoWeHelp.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow group cursor-default">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Our Services</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Comprehensive Credit Solutions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">From CIBIL rectification to dispute assistance — we handle every aspect of your credit health</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {services.map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="stat-card rounded-xl p-4 text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary shrink-0" /> {s}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services"><Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">View All Services <ArrowRight size={16} className="ml-2" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge className="mb-3 bg-accent/20 text-accent-foreground border-accent/30">Why Choose Us</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">What Makes CIR Different</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">{item.icon}</div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Our Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">How It Works</h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-4">
            {processSteps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3 w-full sm:w-[calc(50%-8px)] lg:w-[calc(28%-8px)]">
                <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">{step.num}</div>
                <div>
                  <div className="font-semibold text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-secondary/50 text-secondary-foreground border-secondary/30">Transparent Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Simple, Affordable Plans</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Basic Review", price: "₹999", desc: "Credit report analysis and basic guidance", features: ["Credit Report Analysis", "Score Assessment", "Issue Identification", "Basic Recommendations"] },
              { name: "Standard", price: "₹4,999", desc: "Full consultation with dispute assistance", features: ["Everything in Basic", "Dispute Filing", "Document Assistance", "Follow-up Support", "Progress Tracking"], highlight: true },
              { name: "Premium", price: "Custom", desc: "End-to-end credit restoration", features: ["Everything in Standard", "Dedicated Executive", "Priority Processing", "Unlimited Follow-ups", "Full Resolution Guarantee"] },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`rounded-2xl p-6 h-full flex flex-col ${plan.highlight ? "btn-gradient text-white shadow-lg scale-105" : "glass-card"}`}>
                  <div className="mb-4">
                    <h3 className={`font-bold text-lg ${plan.highlight ? "text-white" : ""}`}>{plan.name}</h3>
                    <div className={`text-3xl font-bold mt-1 ${plan.highlight ? "text-white" : "gradient-text"}`}>{plan.price}</div>
                    <p className={`text-sm mt-1 ${plan.highlight ? "text-white/80" : "text-muted-foreground"}`}>{plan.desc}</p>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-white/90" : "text-foreground"}`}>
                        <CheckCircle size={14} className={plan.highlight ? "text-white" : "text-green-500"} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={plan.highlight ? "bg-white text-primary hover:bg-white/90 border-0" : "btn-gradient border-0 text-white"} onClick={() => setConsultOpen(true)}>
                    Get Started
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-green-100 text-green-700 border-green-200">Success Stories</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Real Results for Real People</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Rahul Sharma", city: "Delhi", issue: "Written off account on CIBIL", before: 480, after: 760, desc: "Home loan approved after 3 months of CIR assistance" },
              { name: "Priya Patel", city: "Mumbai", issue: "Duplicate loan entry showing", before: 510, after: 720, desc: "Car loan approved with lowest interest rate" },
              { name: "Mohammed Faiz", city: "Hyderabad", issue: "Settled status on credit card", before: 445, after: 695, desc: "Business loan sanctioned for ₹15 lakh" },
            ].map((story, i) => (
              <motion.div key={story.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center text-white font-bold">
                      {story.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{story.name}</div>
                      <div className="text-xs text-muted-foreground">{story.city}</div>
                    </div>
                    <div className="ml-auto flex">
                      {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-yellow-400 fill-yellow-400" />)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3 italic">"{story.issue}"</div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-center"><div className="text-xl font-bold text-red-500">{story.before}</div><div className="text-xs text-muted-foreground">Before</div></div>
                    <ArrowRight size={16} className="text-muted-foreground" />
                    <div className="text-center"><div className="text-xl font-bold text-green-500">{story.after}</div><div className="text-xs text-muted-foreground">After</div></div>
                  </div>
                  <p className="text-sm text-foreground">{story.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible>
            {FAQS.slice(0, 10).map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl mb-2 border-0 px-4">
                <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-center mt-6">
            <Link href="/faq"><Button variant="outline">View All FAQs <ArrowRight size={16} className="ml-2" /></Button></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 btn-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Fix Your Credit?</h2>
          <p className="text-white/80 mb-8 text-lg">Get a free consultation and start your credit restoration journey today</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-0 shadow-lg px-8" onClick={() => setConsultOpen(true)}>
              Get Free Consultation
            </Button>
            <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <MessageCircle size={18} className="mr-2" /> WhatsApp Now
              </Button>
            </a>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-8 text-white/70 text-sm">
            <span>Phone: 01169310902</span>
            <span>WhatsApp: +91 9864920810</span>
            <span>support@circonsultationservice.site</span>
          </div>
        </div>
      </section>

      {/* Consultation Modal */}
      <Dialog open={consultOpen} onOpenChange={setConsultOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get Free Consultation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input data-testid="consult-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input data-testid="consult-mobile" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="10-digit mobile number" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input data-testid="consult-email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input data-testid="consult-city" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" />
            </div>
            <div className="space-y-2">
              <Label>Service Required</Label>
              <Select value={form.serviceRequired} onValueChange={v => setForm(p => ({ ...p, serviceRequired: v }))}>
                <SelectTrigger data-testid="consult-service"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {["CIBIL Rectification", "Credit Report Correction", "Score Improvement", "Written Off Account", "Settled Account", "Dispute Assistance", "Financial Consultation"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full btn-gradient border-0 text-white" onClick={handleConsult} disabled={createLead.isPending} data-testid="consult-submit">
              {createLead.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
