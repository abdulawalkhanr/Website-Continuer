import { motion } from "framer-motion";
import { Link } from "wouter";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold gradient-text mb-2">Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 6, 2025 &nbsp;|&nbsp; Effective: June 6, 2025</p>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-10">
          <p className="text-foreground font-medium">At CIR Consultation Service, we are committed to delivering genuine value. Our refund policy is designed to be fair and transparent — protecting both your investment and our ability to provide high-quality service.</p>
        </div>

        <div className="space-y-8 text-foreground/90 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refund Eligibility Summary</h2>
            <div className="grid gap-4">
              <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle size={20} className="text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Full Refund Eligible</p>
                  <p className="text-sm text-green-700 mt-1">We are unable to process your case due to internal eligibility or technical reasons (not caused by you). Refund processed within 7–10 business days.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Partial Refund (Case by Case)</p>
                  <p className="text-sm text-amber-700 mt-1">Work has commenced but you wish to discontinue before the dispute is filed. A partial refund may be considered after deducting work already performed. Contact us within 48 hours of case registration.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <XCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">No Refund</p>
                  <p className="text-sm text-red-700 mt-1">Once the dispute has been formally filed with the credit bureau, no refund is applicable — regardless of the bureau's decision. Credit bureau decisions are beyond our control.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Advance Fee Policy</h2>
            <p>An advance fee is collected at the time of case registration to cover initial consultation, document review, and case setup costs. This fee is:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Non-refundable</strong> once case work has commenced (typically within 24–48 hours of payment)</li>
              <li><strong>Fully refundable</strong> if we determine your case is ineligible before any work begins</li>
              <li><strong>Partially refundable</strong> at our discretion if you cancel within 48 hours and before work commencement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Success Fee / Pending Amount</h2>
            <p>The remaining balance (pending amount) is due only after agreed milestones are achieved. If you have paid the pending amount and raise a genuine dispute:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Refund requests must be raised within 15 days of the payment</li>
              <li>We will review the request within 5 business days</li>
              <li>If the error is on our part, a full refund of the pending amount will be processed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Non-Refundable Situations</h2>
            <p>Refunds will <strong>not</strong> be issued in the following cases:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The credit bureau accepts and investigates your dispute but does not update the record as requested (this is the bureau's decision, not ours)</li>
              <li>You provided incorrect, incomplete, or fabricated documents leading to case rejection</li>
              <li>You failed to respond to our requests for documents or information, causing case closure</li>
              <li>You violated our <Link href="/terms" className="text-primary hover:underline">Terms & Conditions</Link></li>
              <li>The refund request is made more than 30 days after the payment date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. How to Request a Refund</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Email us at <a href="mailto:support@circonsultationservice.in" className="text-primary hover:underline">support@circonsultationservice.in</a> with the subject line: <strong>"Refund Request – [Your Case Number]"</strong></li>
              <li>Include your full name, registered mobile number, payment transaction ID, and reason for the refund request</li>
              <li>Our team will acknowledge your request within 2 business days</li>
              <li>Eligible refunds are processed within <strong>7–10 business days</strong> to your original payment method</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Payment Gateway Refunds</h2>
            <p>Refunds are processed to the original payment instrument used (UPI, credit/debit card, net banking). Once initiated from our end, the credit may take an additional 3–5 business days to appear depending on your bank. CIR Consultation Service is not responsible for delays caused by the payment gateway or your bank.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Dispute Resolution</h2>
            <p>If you are dissatisfied with the outcome of your refund request, you may raise a grievance by writing to our grievance officer at <a href="mailto:support@circonsultationservice.in" className="text-primary hover:underline">support@circonsultationservice.in</a>. We aim to resolve all grievances within 14 days. Unresolved disputes are governed by the laws of India and subject to the jurisdiction of courts in Delhi.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="font-semibold">CIR Consultation Service — Refund & Support Team</p>
              <p>Email: <a href="mailto:support@circonsultationservice.in" className="text-primary hover:underline">support@circonsultationservice.in</a></p>
              <p>Phone: 01169310902 &nbsp;|&nbsp; WhatsApp: +91 9864920810</p>
              <p>Response time: Within 2 business days (Mon–Sat, 10am–6pm IST)</p>
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
