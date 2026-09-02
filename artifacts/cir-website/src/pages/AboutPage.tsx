import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, Eye, Heart, Shield, Star, Users, ChevronDown, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
  const values = [
    { icon: <Shield size={22} />, title: "Integrity", desc: "Transparent, honest service with no hidden charges or false promises" },
    { icon: <Users size={22} />, title: "Customer First", desc: "Every decision is made keeping your best interests in mind" },
    { icon: <Target size={22} />, title: "Excellence", desc: "We strive for the best outcome in every case we handle" },
    { icon: <Heart size={22} />, title: "Empathy", desc: "We understand the stress of credit issues and handle every case with care" },
    { icon: <CheckCircle size={22} />, title: "Accountability", desc: "We take ownership of every case from start to resolution" },
    { icon: <Star size={22} />, title: "Expertise", desc: "Deep knowledge of credit bureau processes, lender practices, and dispute laws" },
  ];

  const team = [
    { name: "Founder & Lead Consultant", initials: "CIR", role: "Credit Resolution Expert", exp: "10+ years in credit industry" },
    { name: "Senior Credit Analyst", initials: "SA", role: "CIBIL & Experian Specialist", exp: "8+ years dispute experience" },
    { name: "Operations Head", initials: "OH", role: "Customer Success Manager", exp: "6+ years in FinTech" },
  ];

  return (
    <div className="min-h-screen">
      <section className="hero-bg py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">About Us</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Your Partner in <span className="gradient-text">Financial Health</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            CIR Consultation Service is a specialized credit health company helping individuals and businesses resolve credit report errors, improve CIBIL scores, and navigate the complex world of credit bureau disputes.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="glass-card rounded-2xl p-8 h-full">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Target size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To democratize access to credit health services in India by providing affordable, professional, and transparent credit report rectification and CIBIL dispute assistance. We believe every Indian deserves a clean credit record and the financial opportunities that come with it.
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="glass-card rounded-2xl p-8 h-full">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent-foreground mb-4">
                <Eye size={24} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become India's most trusted credit health partner, empowering millions of people to achieve their financial goals by resolving credit issues that stand between them and their dreams — whether it's a home loan, business loan, or a better financial future.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-secondary/50 text-secondary-foreground border-secondary/30">Core Values</Badge>
            <h2 className="text-3xl font-bold">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="glass-card rounded-2xl p-6 h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">{v.icon}</div>
                  <h3 className="font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder note — intentionally secondary and collapsed until requested */}
      <section className="py-16 section-bg-alt">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <details className="group glass-card rounded-2xl overflow-hidden">
            <summary className="list-none cursor-pointer p-6 sm:p-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center font-semibold">AA</div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Leadership note</p>
                  <h2 className="text-xl font-semibold mt-1">Meet the founder</h2>
                </div>
              </div>
              <ChevronDown size={20} className="text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
            </summary>
            <div className="border-t border-border/60 px-6 pb-7 pt-6 sm:px-8 sm:pb-8 grid md:grid-cols-[1.4fr_1fr] gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Founder &amp; Managing Director</p>
                <h3 className="text-2xl font-bold mt-2">Abdul Awal Khan</h3>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Abdul Awal Khan leads CIR Consultation Service with a focus on making credit, tax, business registration, and legal documentation support easier to understand and easier to access.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  His approach is centred on clear communication, careful attention to each customer’s situation, and practical guidance throughout the service journey.
                </p>
              </div>
              <div className="rounded-xl bg-background/70 border border-border/60 p-5 self-start">
                <p className="text-sm font-semibold mb-4">Direct founder contact</p>
                <div className="space-y-3 text-sm">
                  <a href="tel:6900637638" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <Phone size={16} className="text-primary shrink-0" /> 6900637638
                  </a>
                  <a href="https://wa.me/916900637638" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center shrink-0">W</span> WhatsApp
                  </a>
                  <a href="mailto:awalkhan3696@gmail.com" className="flex items-start gap-3 text-muted-foreground hover:text-primary transition-colors break-all">
                    <Mail size={16} className="text-primary shrink-0 mt-0.5" /> awalkhan3696@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Why CIR */}
      <section className="py-20 section-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why Choose CIR Consultation</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Specialized focus on credit report rectification — this is ALL we do",
              "Deep relationships with bureau dispute teams and lender escalation desks",
              "Transparent process with real-time case tracking",
              "Dedicated executive for every case — no rotating support teams",
              "Plain-language explanations — no confusing jargon",
              "Nationwide service — we've resolved cases from Kashmir to Kanyakumari",
              "Affordable pricing with flexible payment options",
              "Regular WhatsApp updates so you're never left wondering",
            ].map((point, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 glass-card rounded-xl p-4">
                <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">{point}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: "2000+", label: "Satisfied Customers" },
            { val: "850+", label: "Cases Resolved" },
            { val: "95%", label: "Success Rate" },
            { val: "4+", label: "Years Experience" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-bold gradient-text">{s.val}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 btn-gradient">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Fix Your Credit?</h2>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-0">Get Free Consultation</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
