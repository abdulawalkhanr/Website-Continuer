import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  CheckCircle2, TrendingUp, Shield, Phone, MessageCircle, ArrowRight, 
  Users, Award, Clock, Briefcase, Building2, 
  User, Home, CreditCard, AlertCircle, FileText, Check,
  Lock, Scale, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditScoreGauge } from "@/components/CreditScoreGauge";
import { useCreateLead } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const FAQS = [
  { q: "What is CIBIL score and why does it matter?", a: "CIBIL score is a 3-digit number (300–900) that reflects your creditworthiness. Lenders use it to decide whether to approve loans and credit cards. A score above 750 is considered excellent." },
  { q: "How long does it take to rectify a credit report?", a: "Typically 30–90 days depending on the complexity of the issue and the responsiveness of banks and bureaus. We guide you through every step." },
  { q: "Can a written-off account be removed from my CIBIL report?", a: "Accurate written-off statuses cannot simply be removed. However, we guide you through the settlement and NOC process, and help dispute any incorrect entries or ensure the status is properly updated to 'Settled' once resolved." },
  { q: "What documents are required to start the process?", a: "You need your PAN card, Aadhaar card, latest credit report, and any relevant bank documents (NOC, closure letter, settlement letter)." },
  { q: "Is my personal information kept confidential?", a: "Absolutely. All your data is handled securely and maintained with strict confidentiality. We do not share your information with unauthorized third parties." },
  { q: "Do you guarantee credit score improvement?", a: "We provide professional consultation and dispute assistance. While outcomes depend entirely on bureau and lender responses to factual disputes, our process ensures your case is presented accurately and professionally." },
  { q: "What is the difference between dispute and rectification?", a: "Dispute is the formal process of challenging incorrect entries. Rectification is the outcome — correcting wrong information. We assist with the dispute process to seek rectification." },
  { q: "How do I track my case progress?", a: "Once your case is registered, you receive a unique Case ID. You can track real-time progress through our Customer Portal or by contacting our support team." },
  { q: "Do you handle both CIBIL and other bureau reports?", a: "Yes. We assist with reports from CIBIL (TransUnion), Experian, CRIF High Mark, and Equifax." },
  { q: "What is a settled account and can it be fixed?", a: "A settled account means you paid less than the full amount owed. This negatively impacts your profile. We help initiate NOC requests and dispute incorrectly marked settled statuses." },
  { q: "Can I get a loan after credit rectification?", a: "Correcting your credit report and improving your score enhances your loan eligibility. We provide guidance on maintaining a healthy profile for future applications." },
  { q: "What services does CIR Consultation offer?", a: "We offer CIBIL report analysis, credit report correction guidance, score improvement strategies, dispute assistance, settled/closed account navigation, and general financial consultation." },
  { q: "What is the pricing for your services?", a: "We offer a Basic Review at ₹999, Standard Consultation at ₹4,999, and Premium Assistance at custom pricing based on case complexity." },
  { q: "How does the referral program work?", a: "Refer a friend or colleague who needs credit assistance. When their case is converted, you earn ₹1,000 to ₹3,000 as a referral reward, transferred directly to your bank account." },
  { q: "How do I submit a support ticket?", a: "Log into your Customer Portal, navigate to Support Tickets, and create a new ticket describing your issue. Our team responds promptly." },
  { q: "What if the bureau rejects my dispute?", a: "We analyse the rejection reason, gather additional evidence if available, and re-submit the dispute with stronger documentation. Proper documentation is key." },
  { q: "Can you help with unknown loan entries in my credit report?", a: "Yes. Unknown loan entries are often due to identity theft or data errors. We help you raise disputes with the concerned lender and credit bureau to address them." },
  { q: "How do I contact CIR Consultation Service?", a: "Call us at 01169296558, WhatsApp at +91 6900637638, or email support@circonsultationservice.in. We're available Mon–Sat, 9 AM–7 PM." },
  { q: "Is there an online customer portal?", a: "Yes. After registration, you get access to our Customer Portal where you can track case progress, upload documents, view payments, and raise support tickets." },
  { q: "What happens if my credit issue is not resolved?", a: "We review your case thoroughly, try alternative dispute approaches for factual errors, and guide you on a long-term credit rebuilding strategy for accurate negative information." },
];

const whoWeHelp = [
  { icon: <Briefcase className="w-6 h-6 text-primary" />, title: "Salaried Employees", desc: "Navigate credit issues affecting your loan approvals." },
  { icon: <Building2 className="w-6 h-6 text-accent-foreground" />, title: "Business Owners", desc: "Understand and manage your business credit profile." },
  { icon: <User className="w-6 h-6 text-primary" />, title: "Self Employed", desc: "Professional credit guidance tailored for independent workers." },
  { icon: <Home className="w-6 h-6 text-accent-foreground" />, title: "Loan Applicants", desc: "Address discrepancies before applying for major loans." },
  { icon: <CreditCard className="w-6 h-6 text-primary" />, title: "Credit Card Holders", desc: "Identify and dispute incorrect credit card reporting." },
  { icon: <AlertCircle className="w-6 h-6 text-accent-foreground" />, title: "Unknown Issues", desc: "Guidance for individuals facing unfamiliar report entries." },
];

const services = [
  "CIBIL Rectification Guidance", "Credit Report Analysis", "Score Improvement Strategies",
  "Written-Off Account Navigation", "Settled Account Assistance", "Dispute Filing Support",
  "Profile Review", "Documentation Gathering",
];

const processSteps = [
  { num: "01", title: "Share Credit Report", desc: "Provide your latest credit report for comprehensive analysis." },
  { num: "02", title: "Case Evaluation", desc: "Our experts evaluate your profile to identify discrepancies." },
  { num: "03", title: "Documentation", desc: "We guide you in gathering required documents for disputes." },
  { num: "04", title: "Verification", desc: "Thorough verification of all information before submission." },
  { num: "05", title: "Dispute Filing", desc: "Assistance with submitting formal disputes to bureaus/lenders." },
  { num: "06", title: "Follow Up", desc: "Consistent tracking and follow-up on your dispute status." },
  { num: "07", title: "Resolution", desc: "Reports are updated by bureaus based on factual corrections." },
];

const BgBlobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div 
      animate={{ scale: [1, 1.05, 1], rotate: [0, 45, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/10 blur-[120px]" 
    />
    <motion.div 
      animate={{ scale: [1, 1.1, 1], rotate: [0, -45, 0] }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-accent/10 blur-[120px]" 
    />
  </div>
);

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

  return (
    <div className="flex flex-col bg-background selection:bg-primary/20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
        <BgBlobs />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left Column */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary font-medium text-sm mb-8 border border-primary/20 shadow-sm backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              Professional Credit Consultation Services
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
              Navigate Your Credit Journey <br />
              <span className="gradient-text">With Clarity</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Expert credit report analysis, dispute assistance, and strategic guidance to help you manage and understand your financial profile.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button size="lg" className="h-14 px-8 text-base bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-xl shadow-foreground/10 font-semibold transition-all hover:-translate-y-0.5" onClick={() => setConsultOpen(true)} data-testid="btn-free-consultation">
                Get Free Consultation <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <a href="https://wa.me/916900637638" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-border hover:bg-muted w-full font-semibold transition-all hover:-translate-y-0.5" data-testid="btn-whatsapp">
                  <MessageCircle className="mr-2 w-5 h-5 text-green-600" /> WhatsApp Us
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-semibold text-muted-foreground">
              {["Report Analysis", "Dispute Guidance", "Profile Strategy"].map(t => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Conceptual Graphic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} 
            className="relative z-10 hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-[3rem] transform rotate-3 scale-105 -z-10 blur-xl"></div>
            
            <div className="bg-background/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
              
              <div className="mb-6 w-full text-center">
                <h3 className="font-bold text-foreground text-xl mb-2">Credit Health Overview</h3>
                <p className="text-sm text-muted-foreground">Understanding your report is the first step.</p>
              </div>
              
              <div className="scale-110 my-4">
                <CreditScoreGauge />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                <div className="bg-muted/50 rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                  <FileText className="w-6 h-6 text-primary mb-2" />
                  <span className="text-sm font-semibold text-foreground">Report Review</span>
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
                  <Scale className="w-6 h-6 text-accent-foreground mb-2" />
                  <span className="text-sm font-semibold text-foreground">Dispute Strategy</span>
                </div>
              </div>
            </div>
            
            {/* Floating details */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-background rounded-2xl p-4 shadow-xl border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Strategic Action</div>
                <div className="text-xs text-muted-foreground font-medium">Clear next steps</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22 width=%2232%22 height=%2232%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-opacity=%220.05%22%3E%3Cpath d=%22M0 .5H31.5V32%22/%3E%3C/svg%3E')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          <div className="flex flex-col items-center p-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Detailed Analysis</h4>
            <p className="text-sm text-white/70">Comprehensive review of all credit bureaus.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Strategic Disputes</h4>
            <p className="text-sm text-white/70">Factual challenges to incorrect report entries.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Dedicated Support</h4>
            <p className="text-sm text-white/70">Personalized guidance throughout the process.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Secure & Confidential</h4>
            <p className="text-sm text-white/70">Your data is treated with strict privacy.</p>
          </div>
        </div>
      </section>

      {/* Who We Help */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Who We Help</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-foreground">Guidance For Every Profile</h3>
            <p className="text-lg text-muted-foreground">Whether you're an individual reviewing your history or a business managing credit health, we offer tailored consultation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whoWeHelp.map((item, i) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-background rounded-3xl p-8 border border-border hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-transform">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 text-foreground">{item.title}</h4>
                <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Our Services</h2>
              <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-foreground">Comprehensive Credit Consultation</h3>
              <p className="text-lg text-muted-foreground mb-8">From identifying complex reporting errors to structuring formal disputes, we guide you through every aspect of credit health with professional precision.</p>
              <Link href="/services">
                <Button className="rounded-full h-12 px-8 font-semibold shadow-sm" data-testid="btn-explore-services">
                  Explore All Services <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {services.map((s) => (
                <div key={s} className="flex items-center gap-3 bg-muted/50 p-4 rounded-2xl border border-border/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm border border-border">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us (Bento Box) */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Why CIR Consultation</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-2xl text-foreground">A professional approach to credit management.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-[2rem] p-8 sm:p-12 border border-primary/20 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-3xl rounded-full group-hover:scale-110 transition-transform duration-700"></div>
              <Award className="w-12 h-12 text-primary mb-6 relative z-10" />
              <h4 className="text-3xl font-bold mb-4 text-foreground relative z-10">Experienced Professionals</h4>
              <p className="text-lg text-muted-foreground max-w-md relative z-10">Our team possesses deep understanding of bureau operations and works relentlessly to help identify and dispute inaccuracies on your behalf.</p>
            </div>
            
            <div className="bg-background rounded-[2rem] p-8 sm:p-10 border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
              <Shield className="w-10 h-10 text-accent-foreground mb-5" />
              <h4 className="text-xl font-bold mb-3 text-foreground">Confidential Handling</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">Your financial data is handled securely and maintained with strict confidentiality. We respect your privacy.</p>
            </div>

            <div className="bg-background rounded-[2rem] p-8 sm:p-10 border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
              <Lock className="w-10 h-10 text-primary mb-5" />
              <h4 className="text-xl font-bold mb-3 text-foreground">Factual Disputes</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">We focus on challenging unverified, inaccurate, or outdated information using proper channels and documentation.</p>
            </div>

            <div className="md:col-span-2 bg-foreground text-background rounded-[2rem] p-8 sm:p-12 border border-foreground flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-3xl rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
              <Clock className="w-12 h-12 text-accent mb-6 relative z-10" />
              <h4 className="text-3xl font-bold mb-4 text-background relative z-10">Transparent & Timely</h4>
              <p className="text-background/80 text-lg max-w-lg relative z-10">No hidden charges. You receive regular status updates via our portal and support channels at every step of your journey.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Our Process</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">Structured for clarity and action</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {processSteps.slice(0, 4).map((step, i) => (
              <div key={step.num} className="relative">
                {i !== 3 && (
                  <div className="hidden lg:block absolute top-8 left-[4.5rem] w-[calc(100%-3rem)] h-[2px] bg-border -z-10"></div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center text-xl font-black text-primary mb-6 shadow-sm relative z-10">
                  {step.num}
                </div>
                <h4 className="text-xl font-bold mb-3 text-foreground">{step.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mt-12 lg:mt-16 lg:px-[12.5%]">
            {processSteps.slice(4, 7).map((step, i) => (
              <div key={step.num} className="relative">
                {i !== 2 && (
                  <div className="hidden lg:block absolute top-8 left-[4.5rem] w-[calc(100%-3rem)] h-[2px] bg-border -z-10"></div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center text-xl font-black text-primary mb-6 shadow-sm relative z-10">
                  {step.num}
                </div>
                <h4 className="text-xl font-bold mb-3 text-foreground">{step.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Pricing</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">Clear consultation tiers</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {[
              { name: "Basic Review", price: "₹999", desc: "Credit report analysis and basic guidance", features: ["Credit Report Analysis", "Initial Assessment", "Issue Identification", "Basic Recommendations"] },
              { name: "Standard", price: "₹4,999", desc: "Full consultation with dispute assistance", features: ["Everything in Basic", "Dispute Filing Support", "Document Assistance", "Follow-up Tracking", "Portal Access"], highlight: true },
              { name: "Premium", price: "Custom", desc: "End-to-end extensive case management", features: ["Everything in Standard", "Dedicated Executive", "Priority Processing", "Complex Case Handling", "Long-term Strategy"] },
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-[2rem] p-8 ${plan.highlight ? 'bg-foreground text-background shadow-2xl md:scale-105 z-10 border border-foreground' : 'bg-background border border-border shadow-sm'}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-sm">
                    Most Popular
                  </div>
                )}
                <h4 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-foreground'}`}>{plan.name}</h4>
                <div className="mb-4">
                  <span className={`text-4xl font-extrabold tracking-tight ${plan.highlight ? 'text-white' : 'text-foreground'}`}>{plan.price}</span>
                  {plan.price !== "Custom" && <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>/case</span>}
                </div>
                <p className={`text-sm mb-8 ${plan.highlight ? 'text-white/80' : 'text-muted-foreground'}`}>{plan.desc}</p>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-primary' : 'text-primary'}`} />
                      <span className={`text-sm font-medium ${plan.highlight ? 'text-white/90' : 'text-foreground/80'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full rounded-full h-12 text-base font-semibold ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-foreground hover:bg-muted/80'}`} 
                  onClick={() => setConsultOpen(true)}
                  data-testid={`btn-pricing-${plan.name.toLowerCase().replace(' ', '-')}`}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies / Scenarios */}
      <section className="py-24 bg-muted/30 border-y border-border/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Our Expertise</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">Navigating Complex Scenarios</h3>
            <p className="text-lg text-muted-foreground mt-4">Examples of how we assist clients with different report discrepancies.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { type: "Written-Off Accounts", context: "Outdated or incorrectly reported statuses negatively affecting overall profile.", approach: "We assist in securing necessary closure documents and raising factual disputes to request proper 'Settled' or updated reporting from the bureaus." },
              { type: "Duplicate Entries", context: "A single loan or credit card appearing multiple times, inflating perceived debt.", approach: "We guide clients in structuring disputes highlighting the duplication, providing documentation to have redundant entries consolidated or removed." },
              { type: "Identity Errors", context: "Unknown loans or inquiries attached to a profile due to mistaken identity or fraud.", approach: "We provide strategic support in notifying lenders, raising fraud alerts if necessary, and disputing unrecognized entries aggressively." },
            ].map((study, i) => (
              <motion.div 
                key={study.type} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: i * 0.1 }}
                className="bg-background rounded-3xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">{study.type}</h4>
                <div className="text-sm font-semibold text-foreground/80 mb-2">The Challenge:</div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{study.context}</p>
                <div className="text-sm font-semibold text-foreground/80 mb-2">Our Approach:</div>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">{study.approach}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">FAQ</h2>
            <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">Common Questions</h3>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {FAQS.slice(0, 6).map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-background border border-border rounded-2xl px-6 data-[state=open]:shadow-sm transition-all">
                <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline py-6 text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="text-center mt-12">
            <Link href="/faq">
              <Button variant="outline" className="rounded-full h-12 px-8 font-semibold" data-testid="btn-view-faqs">
                View All FAQs <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-foreground"></div>
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-primary/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-accent/20 blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Ready for a <span className="text-primary">Clear Strategy?</span>
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Get a free consultation and start addressing your credit report concerns today with professional guidance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-bold w-full sm:w-auto rounded-full shadow-xl shadow-primary/20" onClick={() => setConsultOpen(true)} data-testid="btn-cta-consultation">
              Get Free Consultation
            </Button>
            <a href="https://wa.me/916900637638" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/20 text-white hover:bg-white/10 w-full rounded-full font-semibold" data-testid="btn-cta-whatsapp">
                <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp Now
              </Button>
            </a>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-10 text-white/60 text-sm font-medium">
            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> 01169296558</span>
            <span className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-400" /> +91 6900637638</span>
            <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /> support@circonsultationservice.in</span>
          </div>
        </div>
      </section>

      {/* Consultation Modal */}
      <Dialog open={consultOpen} onOpenChange={setConsultOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-foreground">Get Free Consultation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">Name *</Label>
              <Input data-testid="consult-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Mobile Number *</Label>
              <Input data-testid="consult-mobile" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="10-digit mobile number" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Email</Label>
              <Input data-testid="consult-email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">City</Label>
              <Input data-testid="consult-city" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Your city" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Service Required</Label>
              <Select value={form.serviceRequired} onValueChange={v => setForm(p => ({ ...p, serviceRequired: v }))}>
                <SelectTrigger data-testid="consult-service" className="h-12 rounded-xl"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {["CIBIL Rectification Guidance", "Credit Report Analysis", "Score Improvement Strategy", "Written Off Account", "Settled Account", "Dispute Assistance", "Financial Consultation"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl mt-2 shadow-md shadow-primary/10" onClick={handleConsult} disabled={createLead.isPending} data-testid="consult-submit">
              {createLead.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
