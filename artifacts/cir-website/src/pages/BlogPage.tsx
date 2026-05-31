import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const articles = [
  { title: "How to Read Your CIBIL Report: A Complete Guide", category: "Credit Education", readTime: "8 min", date: "May 15, 2026", excerpt: "Your CIBIL report contains a wealth of information. Learn how to decode each section, understand account statuses, and identify errors that may be pulling down your score.", color: "bg-primary/10 text-primary" },
  { title: "7 Reasons Your Credit Score Might Be Lower Than Expected", category: "Credit Score Tips", readTime: "6 min", date: "May 10, 2026", excerpt: "Even if you pay your EMIs on time, several factors could be silently dragging down your credit score. Discover the hidden culprits and how to fix them.", color: "bg-secondary/50 text-secondary-foreground" },
  { title: "Written Off vs Settled vs Closed: What's the Difference?", category: "Credit Education", readTime: "5 min", date: "May 5, 2026", excerpt: "These three account statuses have very different impacts on your credit health. Understanding them is the first step to fixing your credit report.", color: "bg-accent/20 text-accent-foreground" },
  { title: "How to Get a Loan After CIBIL Dispute Resolution", category: "Financial Awareness", readTime: "7 min", date: "April 28, 2026", excerpt: "Once your credit report is cleaned up, there's a right way to apply for loans to maximize your approval chances and get the best interest rates.", color: "bg-green-100 text-green-700" },
  { title: "The RBI Guidelines You Need to Know About Credit Disputes", category: "Banking Guidance", readTime: "10 min", date: "April 20, 2026", excerpt: "RBI has specific regulations protecting you during credit disputes. Learn your rights and how to escalate complaints if bureaus or lenders are unresponsive.", color: "bg-primary/10 text-primary" },
  { title: "How to Improve Your Credit Score from 500 to 750 in 12 Months", category: "Credit Score Tips", readTime: "9 min", date: "April 12, 2026", excerpt: "A practical, step-by-step roadmap for rebuilding your credit score from a low base. Real strategies that have worked for our customers.", color: "bg-secondary/50 text-secondary-foreground" },
  { title: "Identity Theft and Credit Reports: How to Protect Yourself", category: "Financial Awareness", readTime: "7 min", date: "April 5, 2026", excerpt: "Unknown loans in your credit report could indicate identity theft. Learn the warning signs and immediate steps to take if you suspect fraud.", color: "bg-red-100 text-red-700" },
  { title: "Credit Utilization: The Overlooked Factor in Your CIBIL Score", category: "Credit Score Tips", readTime: "5 min", date: "March 28, 2026", excerpt: "Keeping your credit card balances low relative to your limit can significantly impact your score. Here's the optimal utilization ratio and how to achieve it.", color: "bg-accent/20 text-accent-foreground" },
  { title: "How Banks Report to Credit Bureaus: A Behind-the-Scenes Look", category: "Banking Guidance", readTime: "8 min", date: "March 20, 2026", excerpt: "Understanding when and how banks update credit bureau data can help you time your loan applications and disputes more effectively.", color: "bg-green-100 text-green-700" },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Knowledge Hub</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Credit Education Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Expert insights on credit scores, CIBIL disputes, and financial health — written in plain language</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Article */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <div className="glass-card rounded-2xl p-8 md:grid md:grid-cols-2 gap-8 items-center">
              <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-6 md:mb-0">
                <span className="text-6xl font-black gradient-text opacity-30">CIR</span>
              </div>
              <div>
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Featured</Badge>
                <h2 className="text-2xl font-bold mb-3">{articles[0].title}</h2>
                <p className="text-muted-foreground text-sm mb-4">{articles[0].excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span>{articles[0].date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {articles[0].readTime} read</span>
                </div>
                <Button className="btn-gradient border-0 text-white">Read Article <ArrowRight size={16} className="ml-2" /></Button>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.slice(1).map((article, i) => (
              <motion.div key={article.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col cursor-pointer hover:shadow-lg transition-shadow group">
                  <div className="h-32 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-xl mb-4" />
                  <Badge className={`mb-3 text-xs w-fit ${article.color} border-0`}>{article.category}</Badge>
                  <h3 className="font-bold mb-2 group-hover:text-primary transition-colors leading-snug">{article.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{article.date}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {article.readTime}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
