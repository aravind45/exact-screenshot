import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for ExpectedEstate - How we collect, use, and protect your data"
        canonical="https://expectedestate.com/privacy"
      />
      <Header />
      
      <main className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-12">Last Updated: February 15, 2026</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p>
                ExpectedEstate ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, password</li>
                <li><strong>Estate Information:</strong> Deceased person details, asset information, beneficiary data</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card numbers)</li>
                <li><strong>Communications:</strong> Messages, support requests, feedback</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain the Service</li>
                <li>Process your transactions</li>
                <li>Send you updates and notifications</li>
                <li>Respond to your requests and support needs</li>
                <li>Improve and optimize the Service</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <p className="font-semibold text-green-900 mb-2">Security Measures:</p>
                <ul className="list-disc pl-6 space-y-2 text-green-800">
                  <li><strong>Encryption:</strong> All data transmitted using SSL/TLS encryption</li>
                  <li><strong>Database Security:</strong> Encrypted at rest in SOC 2 compliant data centers</li>
                  <li><strong>Access Controls:</strong> Role-based access and authentication</li>
                  <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
                  <li><strong>Backup:</strong> Regular encrypted backups</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
              <p>We do NOT sell your personal information. We may share your information with:</p>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Payment Processing:</strong> Stripe (for payment processing)</li>
                <li><strong>Cloud Hosting:</strong> Vercel, Google Cloud (for infrastructure)</li>
                <li><strong>Analytics:</strong> Google Analytics (anonymized data)</li>
                <li><strong>Email:</strong> Email service providers (for transactional emails)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Legal Requirements</h3>
              <p>We may disclose your information if required by law, court order, or government request.</p>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
                <li><strong>Cookies:</strong> Disable cookies in your browser settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide the Service. 
                After account deletion, we may retain certain information for legal compliance, fraud prevention, and 
                dispute resolution purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
              <p>
                The Service is not intended for children under 18. We do not knowingly collect information from children. 
                If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. California Privacy Rights (CCPA)</h2>
              <p>California residents have additional rights under the California Consumer Privacy Act:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to opt-out of the sale of personal information (we do not sell data)</li>
                <li>Right to deletion of personal information</li>
                <li>Right to non-discrimination for exercising CCPA rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. International Users</h2>
              <p>
                If you are accessing the Service from outside the United States, your information may be transferred to, 
                stored, and processed in the United States where our servers are located.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Third-Party Links</h2>
              <p>
                The Service may contain links to third-party websites. We are not responsible for the privacy practices 
                of these external sites. Please review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email 
                or through the Service. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
              <p>
                For questions about this Privacy Policy or to exercise your rights, contact us at:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-4">
                <p><strong>Email:</strong> <a href="mailto:expected.estate@gmail.com" className="text-primary hover:underline">expected.estate@gmail.com</a></p>
                <p className="mt-2"><strong>Subject Line:</strong> Privacy Request</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
