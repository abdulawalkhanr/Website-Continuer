import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Phone, MessageCircle } from "lucide-react";

const FAQS = [
  { q: "What is CIBIL score and why does it matter?", a: "CIBIL score is a 3-digit number (300–900) that reflects your creditworthiness. Lenders use it to decide whether to approve loans and credit cards. A score above 750 is considered excellent. It is calculated based on your credit history, payment track record, credit utilization, and other factors." },
  { q: "How long does it take to rectify a credit report?", a: "Typically 30–90 days depending on the complexity of the issue and the responsiveness of banks and bureaus. Simple corrections like wrong personal information can be resolved in 15–30 days, while complex disputes involving written-off accounts may take 60–90 days." },
  { q: "Can a written-off account be removed from my CIBIL report?", a: "Yes. With proper documentation and dispute assistance, written-off accounts can be rectified or updated to reflect the correct status once settlement is completed. You need an NOC and settlement letter from the lender." },
  { q: "What documents are required to start the process?", a: "You need your PAN card, Aadhaar card, latest credit report, and any relevant bank documents (NOC, closure letter, settlement letter). Our team provides a detailed document checklist specific to your case." },
  { q: "Is my personal information kept confidential?", a: "Absolutely. All your data is handled with strict confidentiality under our privacy policy. We use encrypted channels for communication and document storage. We never share your information with third parties without your explicit consent." },
  { q: "Do you guarantee credit score improvement?", a: "We provide professional consultation and dispute assistance. While outcomes depend on bureau and lender responses, our process maximizes the chances of successful rectification. We have a 95%+ success rate for valid disputes." },
  { q: "What is the difference between dispute and rectification?", a: "Dispute is the formal process of challenging incorrect entries with the credit bureau or lender. Rectification is the outcome — the actual correction of wrong information in your credit report. We assist with both — drafting disputes and following up until rectification is confirmed." },
  { q: "How do I track my case progress?", a: "Once your case is registered, you receive a unique Case ID (e.g., CIR-2026-1234). You can track real-time progress through our Customer Portal or by using the Track Case feature on our website. We also send WhatsApp and email updates at each milestone." },
  { q: "Do you handle both CIBIL and other bureau reports?", a: "Yes. We assist with reports from all 4 major credit bureaus in India: CIBIL (TransUnion), Experian, CRIF High Mark, and Equifax. Our experts are familiar with the dispute processes for all bureaus." },
  { q: "What is a settled account and can it be fixed?", a: "A settled account means you paid less than the full outstanding amount. This is marked negatively in your credit report. We help you obtain an NOC from the lender, dispute the incorrect settled marking if you paid in full, or guide you on upgrading the status to 'Closed'." },
  { q: "Can I get a loan after credit rectification?", a: "Yes. Once your credit report is corrected and score improves to 750+, your loan eligibility improves significantly. We provide guidance on the right time to apply and which lenders are most likely to approve your application." },
  { q: "What services does CIR Consultation offer?", a: "We offer CIBIL rectification, credit report correction across all bureaus, score improvement guidance, dispute assistance with banks and NBFCs, written-off/settled/closed account rectification, credit profile review, documentation assistance, and comprehensive financial consultation." },
  { q: "What is the pricing for your services?", a: "We offer three plans: Basic Review at ₹999 (analysis and recommendations), Standard Consultation at ₹4,999 (full dispute filing and follow-up), and Premium Assistance at custom pricing for complex multi-issue cases. All prices are transparent with no hidden charges." },
  { q: "How does the referral program work?", a: "Refer a friend or family member who needs credit assistance. When their case is converted to a paying customer, you earn ₹1,000 to ₹3,000 as referral reward. The reward amount depends on the service plan purchased. Payment is transferred directly to your bank account." },
  { q: "How do I submit a support ticket?", a: "Log into your Customer Portal, navigate to Support Tickets, and create a new ticket describing your issue. Our team responds within 24 hours on business days. You can track ticket status and responses through the portal." },
  { q: "What if the bureau rejects my dispute?", a: "We analyse the rejection reason, gather additional evidence, strengthen the documentation, and re-submit the dispute. Bureau rejections are often due to insufficient evidence — we help build a stronger case. Most disputes are resolved within 1-3 attempts." },
  { q: "Can you help with unknown loan entries in my credit report?", a: "Yes. Unknown loan entries are often due to identity theft, data entry errors, or shared personal information. We help you raise disputes with the concerned lender and credit bureau, and guide you through the process of getting fraudulent accounts blocked." },
  { q: "How do I contact CIR Consultation Service?", a: "Call us at 01169310902 (Mon–Sat, 9 AM–7 PM), WhatsApp at +91 9864920810 (24/7), or email support@circonsultationservice.site. We also have a contact form on our website and an AI chatbot for immediate assistance." },
  { q: "Is there an online customer portal?", a: "Yes. After registration, you get access to our comprehensive Customer Portal where you can track case progress with a detailed timeline, upload and download documents, view payment details and receipts, raise support tickets, and receive notifications." },
  { q: "What happens if my credit issue is not resolved?", a: "We review your case thoroughly, try alternative dispute approaches, escalate to higher authorities at the bureau/lender, and if the issue is genuinely unresolvable (e.g., correct negative information from legitimate defaults), we guide you on a structured credit rebuilding strategy." },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <section className="hero-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">FAQ</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything you need to know about credit rectification and our services</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl border-0 px-5">
                <AccordionTrigger className="text-left font-medium py-5">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-16 text-center">
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
              <p className="text-muted-foreground mb-6">Our credit experts are ready to help you</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="tel:01169310902">
                  <Button size="lg" className="btn-gradient border-0 text-white"><Phone size={18} className="mr-2" /> Call 01169310902</Button>
                </a>
                <a href="https://wa.me/919864920810" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50"><MessageCircle size={18} className="mr-2" /> WhatsApp Us</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
