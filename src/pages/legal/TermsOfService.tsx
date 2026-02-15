import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";

export default function TermsOfService() {
  return (
    <div className="min-h-screen">
      <SEO
        title="Terms of Service"
        description="Terms of Service for ExpectedEstate - Estate settlement and probate management platform"
        canonical="https://expectedestate.com/terms"
      />
      <Header />
      
      <main className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-12">Last Updated: February 15, 2026</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using ExpectedEstate ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p>
                ExpectedEstate provides estate settlement and probate management tools, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Asset tracking and management</li>
                <li>Document organization and storage</li>
                <li>Settlement roadmap and task management</li>
                <li>Form generation and guidance</li>
                <li>Communication logging</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Not Legal Advice</h2>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
                <p className="font-semibold text-amber-900 mb-2">IMPORTANT DISCLAIMER:</p>
                <p className="text-amber-800">
                  ExpectedEstate is NOT a law firm and does NOT provide legal advice. The Service provides administrative 
                  tools and educational information only. Use of the Service does not create an attorney-client relationship. 
                  You should consult with a licensed attorney for legal advice specific to your situation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. User Accounts</h2>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and complete information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Upload malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Subscription and Payment</h2>
              <p>
                Certain features require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pay all fees associated with your subscription plan</li>
                <li>Automatic renewal unless cancelled</li>
                <li>No refunds for partial subscription periods</li>
                <li>Price changes with 30 days notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Data and Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. We take data security seriously and 
                implement industry-standard measures to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Service are owned by ExpectedEstate and are protected 
                by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <p className="font-semibold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                <p>
                  ExpectedEstate shall not be liable for any indirect, incidental, special, consequential, or punitive 
                  damages, including but not limited to loss of profits, data, use, or other intangible losses resulting 
                  from your use of the Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless ExpectedEstate from any claims, damages, losses, liabilities, 
                and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violation of these Terms or 
                for any other reason at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance 
                of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by the laws of the State of California, without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
              <p>
                For questions about these Terms, contact us at:{" "}
                <a href="mailto:expected.estate@gmail.com" className="text-primary hover:underline">
                  expected.estate@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
