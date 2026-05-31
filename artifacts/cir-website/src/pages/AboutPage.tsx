import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, Eye, Heart, Shield, Star, Users } from "lucide-react";
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
