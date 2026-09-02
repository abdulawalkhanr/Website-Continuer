import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold gradient-text mb-2">Disclaimer</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 6, 2025</p>

        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10">
          <AlertTriangle size={22} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-800 font-medium">Please read this disclaimer carefully before using our services or relying on any information provided on this website.</p>
        </div>

        <div className="space-y-8 text-foreground/90 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. No Guarantee of Results</h2>
            <p>CIR Consultation Service provides credit report rectification assistance and CIBIL dispute consultancy. While we strive to achieve the best possible outcome for every client, we <strong>do not guarantee</strong> any specific credit score improvement or dispute resolution outcome.</p>
            <p className="mt-2">Credit bureau decisions are made independently by CIBIL, Experian, Equifax, or CRIF based on their own policies and the information on record. The final outcome is beyond our control.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Not a Financial Institution</h2>
            <p>CIR Consultation Service is a <strong>consultancy service</strong>. We are not a bank, non-banking financial company (NBFC), credit rating agency, or financial advisor regulated by RBI or SEBI. Our services are limited to assisting you in navigating the dispute and rectification process with credit bureaus.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Informational Content</h2>
            <p>All content published on this website — including blog articles, FAQs, and process guides — is for <strong>general informational purposes only</strong>. It does not constitute legal, financial, or professional advice. You should consult a qualified professional before making any financial decisions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites such as credit bureau portals. These links are provided for convenience only. CIR Consultation Service has no control over the content or policies of third-party sites and accepts no responsibility for them.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Accuracy of Information</h2>
            <p>We make reasonable efforts to ensure that information on this website is accurate and up to date. However, we make no representations or warranties — express or implied — about the completeness, accuracy, or reliability of any information provided. Information may change without notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Testimonials and Success Stories</h2>
            <p>Client testimonials and success stories on our website are real experiences shared by our customers. However, individual results vary. Past performance is not a guarantee of future results. Credit outcomes depend on individual credit history, accuracy of information provided, and credit bureau decisions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, CIR Consultation Service and its officers, employees, or agents shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your use of or inability to use our website or services</li>
              <li>Any credit bureau decision, including rejection of a dispute</li>
              <li>Any reliance placed on the content of this website</li>
              <li>Unauthorized access to your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Governing Law</h2>
            <p>This disclaimer is governed by the laws of India. Any disputes arising from the use of this website or our services shall be subject to the exclusive jurisdiction of the courts of Delhi, India.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact</h2>
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
