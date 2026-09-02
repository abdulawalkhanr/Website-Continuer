import { motion } from "framer-motion";
import { Link } from "wouter";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold gradient-text mb-2">Terms &amp; Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 6, 2025 &nbsp;|&nbsp; Effective: June 6, 2025</p>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground/90 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the website <strong>www.circonsultationservice.in</strong> or any services offered by CIR Consultation Service ("Company", "we", "us"), you agree to be bound by these Terms &amp; Conditions and our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. If you do not agree, you must not use our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Nature of Services</h2>
            <p>CIR Consultation Service provides:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Credit report rectification assistance</li>
              <li>CIBIL and credit bureau dispute filing and follow-up</li>
              <li>Credit score improvement guidance and counselling</li>
              <li>Document preparation support for dispute cases</li>
            </ul>
            <p className="mt-3 font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">Important Disclaimer: We are a consultancy service. We do not guarantee a specific credit score outcome. Results depend on the accuracy of information provided by you and the decision of the respective credit bureau(s).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Eligibility</h2>
            <p>To use our services, you must:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Be at least 18 years of age</li>
              <li>Be an Indian citizen or resident</li>
              <li>Have a valid mobile number and email address</li>
              <li>Provide accurate and truthful information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Account Registration</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at <a href="mailto:support@circonsultationservice.in" className="text-primary hover:underline">support@circonsultationservice.in</a> if you suspect unauthorized access to your account. CIR Consultation Service will not be liable for any loss arising from unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Fees and Payment</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Service fees are displayed clearly on our <Link href="/pricing" className="text-primary hover:underline">Pricing page</Link> and confirmed before payment</li>
              <li>An advance fee is collected at the time of case registration</li>
              <li>Remaining fees are due upon successful case resolution as per the agreed payment plan</li>
              <li>All payments are processed securely through PayU payment gateway</li>
              <li>Fees are inclusive of applicable GST unless stated otherwise</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Refund Policy</h2>
            <p>Please refer to our <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> for full details. In summary:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Advance fees paid at case registration are non-refundable once work has commenced</li>
              <li>If we are unable to file your case due to eligibility reasons, a full refund of the advance is processed within 7–10 business days</li>
              <li>No refund is issued for cases where the credit bureau rejects the dispute after filing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Client Obligations</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide accurate and complete information and documents</li>
              <li>Respond to our queries within a reasonable time</li>
              <li>Not provide false or fabricated documents — doing so is illegal and will result in immediate termination of services without refund</li>
              <li>Not use our services for any unlawful purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Intellectual Property</h2>
            <p>All content on this website — including text, graphics, logos, page layouts, and software — is the exclusive property of CIR Consultation Service. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, CIR Consultation Service shall not be liable for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of income or profits arising from credit score decisions by bureaus</li>
              <li>Any third-party actions, including credit bureau decisions</li>
              <li>Delays caused by incomplete documents or non-cooperation from your end</li>
            </ul>
            <p className="mt-2">Our total liability in any case shall not exceed the amount you paid us for the specific service in dispute.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Termination</h2>
            <p>We reserve the right to suspend or terminate your account and services if you:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide false information or fraudulent documents</li>
              <li>Abuse our staff or support team</li>
              <li>Violate any provision of these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Governing Law & Dispute Resolution</h2>
            <p>These Terms are governed by the laws of India. Any disputes arising shall first be attempted to be resolved through mutual negotiation. Failing that, disputes shall be subject to the exclusive jurisdiction of the courts of Delhi, India.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to Terms</h2>
            <p>We reserve the right to update these Terms at any time. Continued use of our services after such changes constitutes your acceptance of the revised Terms. We recommend reviewing this page periodically.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="font-semibold">CIR Consultation Service</p>
              <p>Email: <a href="mailto:support@circonsultationservice.in" className="text-primary hover:underline">support@circonsultationservice.in</a></p>
              <p>Phone: 01169296558 &nbsp;|&nbsp; WhatsApp: +91 6900637638</p>
              <p>Website: <a href="https://www.circonsultationservice.in" className="text-primary hover:underline">www.circonsultationservice.in</a></p>
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
