import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold gradient-text mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 6, 2025 &nbsp;|&nbsp; Effective: June 6, 2025</p>

        <div className="prose prose-slate max-w-none space-y-8 text-foreground/90 leading-relaxed">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p>CIR Consultation Service ("Company", "we", "us", or "our"), operating at <strong>www.circonsultationservice.in</strong>, is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, store, and share information about you when you use our website, services, and customer portal.</p>
            <p className="mt-2">By accessing our website or using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="font-medium">2.1 Information You Provide Directly:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Name, email address, mobile number, and city</li>
              <li>CIBIL score details and credit report information</li>
              <li>Financial documents uploaded for dispute processing</li>
              <li>Payment details (processed securely via PayU; we do not store card details)</li>
              <li>Communications you send us through the portal or contact form</li>
            </ul>
            <p className="font-medium mt-4">2.2 Information Collected Automatically:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>IP address, browser type, and operating system</li>
              <li>Pages visited, time spent, and navigation paths</li>
              <li>Session cookies for authentication purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide credit report rectification and CIBIL dispute assistance services</li>
              <li>To create and manage your customer account and case dashboard</li>
              <li>To process payments and send payment receipts</li>
              <li>To communicate case updates, service notifications, and support responses</li>
              <li>To send OTPs for mobile number verification</li>
              <li>To improve our platform and customer experience</li>
              <li>To comply with legal obligations under applicable Indian law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Sharing of Information</h2>
            <p>We do <strong>not</strong> sell, rent, or trade your personal data. We may share your information only in the following limited circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Credit Bureaus:</strong> CIBIL, Experian, Equifax, or CRIF, as necessary to process your dispute</li>
              <li><strong>Payment Processors:</strong> PayU, for secure payment processing</li>
              <li><strong>SMS Gateway:</strong> Fast2SMS, for delivering OTP messages</li>
              <li><strong>Legal Requirements:</strong> If required by law, court order, or government authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>256-bit SSL/TLS encryption for all data in transit</li>
              <li>Passwords stored as salted SHA-256 hashes — never in plain text</li>
              <li>Session-based authentication with HttpOnly cookies</li>
              <li>Restricted database access — only authorized personnel can access production data</li>
            </ul>
            <p className="mt-2">Despite our measures, no method of transmission over the internet is 100% secure. We encourage you to use a strong password and not share your login credentials.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide services. If you request account deletion, we will erase your personal data within 30 days, except where retention is required by law (e.g., GST records, financial transaction logs).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
            <p>Under applicable Indian data protection law, you have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for marketing communications at any time</li>
              <li>Raise a grievance with our data protection officer</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, email us at <a href="mailto:support@circonsultationservice.in" className="text-primary hover:underline">support@circonsultationservice.in</a>.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookies</h2>
            <p>We use strictly necessary cookies to maintain your login session. We do not use third-party advertising or tracking cookies. You may disable cookies in your browser settings, but this will prevent you from logging into our portal.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Children's Privacy</h2>
            <p>Our services are intended for individuals aged 18 and above. We do not knowingly collect personal data from minors. If you believe a minor has provided us with data, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of our services after changes constitutes acceptance of the new policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="font-semibold">CIR Consultation Service</p>
              <p>Website: <a href="https://www.circonsultationservice.in" className="text-primary hover:underline">www.circonsultationservice.in</a></p>
              <p>Email: <a href="mailto:support@circonsultationservice.in" className="text-primary hover:underline">support@circonsultationservice.in</a></p>
              <p>Phone: 01169296558</p>
              <p>WhatsApp: +91 6900637638</p>
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
