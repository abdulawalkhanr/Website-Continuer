import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const stories = [
  { name: "Rahul Sharma", city: "Delhi", service: "Written Off Account Rectification", issue: "A written-off personal loan from 2019 was preventing him from getting a home loan. Score was stuck at 480.", process: "We identified the lender, arranged NOC acquisition, filed formal dispute with CIBIL, and followed up until the status was updated to 'Closed'.", outcome: "Score improved to 760 in 75 days. Home loan of ₹35 lakh approved.", before: 480, after: 760 },
  { name: "Priya Patel", city: "Mumbai", service: "Duplicate Loan Entry Removal", issue: "A paid education loan was showing twice in her credit report — once as active and once as closed. Score was 510.", process: "We worked with the bank to identify the duplicate entry, filed a dispute with supporting documentation, and followed up with both CIBIL and the lender.", outcome: "Duplicate entry removed in 45 days. Score jumped to 720. Car loan approved at 8.5% interest.", before: 510, after: 720 },
  { name: "Mohammed Faiz", city: "Hyderabad", service: "Settled Credit Card Rectification", issue: "Credit card settled at reduced amount in 2020. Showing as 'Settled' despite full NOC from bank.", process: "Obtained bank acknowledgment of full settlement, drafted dispute letter with NOC as evidence, and escalated to RBI Ombudsman when bureau was slow to respond.", outcome: "Status changed to 'Closed'. Score improved to 695. Business loan of ₹15 lakh approved.", before: 445, after: 695 },
  { name: "Sunita Verma", city: "Pune", service: "Unknown Loan Entry Removal", issue: "An unknown personal loan of ₹2 lakh from an NBFC was appearing in her credit report — she never took this loan.", process: "We identified it as a case of identity misuse, filed police complaint guidance, disputed with bureau citing fraud, and worked with the NBFC compliance team.", outcome: "Fraudulent entry removed in 60 days. Score improved from 430 to 680. Credit card approved.", before: 430, after: 680 },
  { name: "Arjun Kapoor", city: "Bangalore", service: "Multiple Dispute Assistance", issue: "Three different issues: wrong address, one settled loan, and high credit utilization showing incorrectly.", process: "Handled all three disputes simultaneously. Corrected personal info, changed settled to closed with NOC, and disputed incorrect utilization with card statements.", outcome: "All three resolved in 90 days. Score went from 520 to 750. Personal loan of ₹5 lakh approved.", before: 520, after: 750 },
  { name: "Kavita Singh", city: "Jaipur", service: "Closed Account Not Updated", issue: "A car loan closed in 2022 was still showing as 'Active' in her credit report for over a year.", process: "Collected closure letter from the bank, filed dispute with CRIF and CIBIL, and escalated to bank's nodal officer when initial response was delayed.", outcome: "Corrected in 30 days. Score improved from 590 to 720. New car loan approved for ₹8 lakh.", before: 590, after: 720 },
];

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">Success Stories</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Real People, Real Results</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Every case is unique. Here's how we've helped real customers across India resolve their credit issues.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 section-bg-alt">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val: "850+", label: "Cases Resolved" },
            { val: "150+", label: "Avg Score Jump" },
            { val: "95%", label: "Success Rate" },
            { val: "30–90", label: "Days to Resolution" },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl p-5 text-center">
              <div className="text-3xl font-bold gradient-text">{s.val}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          {stories.map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
              <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{s.city}</div>
                    <div className="flex mt-1">{[1,2,3,4,5].map(n => <Star key={n} size={12} className="text-yellow-400 fill-yellow-400" />)}</div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{s.service}</Badge>
                </div>

                <div className="flex items-center gap-4 mb-5 p-3 bg-muted/50 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{s.before}</div>
                    <div className="text-xs text-muted-foreground">Before</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp size={16} />
                      <span className="text-sm font-semibold">+{s.after - s.before}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{s.after}</div>
                    <div className="text-xs text-muted-foreground">After</div>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <div className="text-xs font-semibold text-red-500 mb-1">The Problem</div>
                    <p className="text-sm text-muted-foreground">{s.issue}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-primary mb-1">Our Approach</div>
                    <p className="text-sm text-muted-foreground">{s.process}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-green-600 mb-1">The Outcome</div>
                    <p className="text-sm font-medium text-foreground">{s.outcome}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 btn-gradient">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Your Story Could Be Next</h2>
          <p className="text-white/80 mb-6">Join 2,000+ customers who've resolved their credit issues with CIR</p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-0">
              Get Free Consultation <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
