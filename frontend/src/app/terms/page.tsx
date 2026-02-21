'use client';

import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                <span className="text-slate-900 font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                OxyManager
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 mb-6">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms & Conditions</h1>
            <p className="text-slate-400 text-lg">Last updated: January 28, 2026</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
                <p className="text-slate-300 leading-relaxed">
                  By accessing or using OxyManager (&quot;Service&quot;, &quot;Platform&quot;, &quot;Software&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                <p className="text-slate-300 leading-relaxed">
                  OxyManager is a comprehensive business management software platform that provides tools for inventory management, sales tracking, customer relationship management, banking integration, SMS marketing, and related business operations. The Service is provided on a subscription basis with different pricing tiers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">3.1 Account Creation</h3>
                    <p className="leading-relaxed">
                      To use the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">3.2 Account Security</h3>
                    <p className="leading-relaxed">
                      You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized access or security breach.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">3.3 Account Eligibility</h3>
                    <p className="leading-relaxed">
                      You must be at least 18 years old and legally capable of entering into binding contracts to use the Service. By using the Service, you represent and warrant that you meet these requirements.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Subscription and Payment</h2>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.1 Subscription Plans</h3>
                    <p className="leading-relaxed">
                      We offer various subscription plans (Free, Pro, Enterprise) with different features and limitations. Subscription fees are billed in advance on a monthly or annual basis.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.2 Free Trial</h3>
                    <p className="leading-relaxed">
                      We offer a 14-day free trial for Pro plans. No credit card is required for the trial. After the trial period, your subscription will automatically convert to a paid plan unless you cancel.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.3 Payment Terms</h3>
                    <p className="leading-relaxed">
                      Payment is due at the beginning of each billing cycle. We accept bKash, Nagad, credit/debit cards, and other payment methods. All fees are non-refundable except as required by law or as explicitly stated in these Terms.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.4 Price Changes</h3>
                    <p className="leading-relaxed">
                      We reserve the right to modify subscription fees. We will provide at least 30 days&apos; notice of any price changes. Continued use after the price change constitutes acceptance of the new pricing.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">4.5 Cancellation</h3>
                    <p className="leading-relaxed">
                      You may cancel your subscription at any time. Cancellation will be effective at the end of your current billing period. You will retain access to paid features until the end of the billing period.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. User Responsibilities</h2>
                <div className="space-y-3 text-slate-300">
                  <p className="leading-relaxed">You agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                    <li>Not use the Service in any way that violates applicable laws or regulations</li>
                    <li>Not engage in any conduct that restricts or inhibits anyone&apos;s use of the Service</li>
                    <li>Not attempt to gain unauthorized access to any portion of the Service</li>
                    <li>Not transmit any viruses, malware, or other malicious code</li>
                    <li>Not use the Service to send spam or unsolicited communications</li>
                    <li>Maintain the security and confidentiality of your account credentials</li>
                    <li>Comply with all applicable data protection and privacy laws</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property Rights</h2>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">6.1 Our Property</h3>
                    <p className="leading-relaxed">
                      The Service and its original content, features, and functionality are owned by OxyManager and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">6.2 Your Data</h3>
                    <p className="leading-relaxed">
                      You retain all rights to the data you input into the Service. By using the Service, you grant us a limited license to use, store, and process your data solely for the purpose of providing the Service to you.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">6.3 Feedback</h3>
                    <p className="leading-relaxed">
                      Any feedback, suggestions, or ideas you provide to us regarding the Service become our property, and we may use them without any obligation to you.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Data Privacy and Security</h2>
                <p className="text-slate-300 leading-relaxed">
                  Your use of the Service is also governed by our Privacy Policy. We implement industry-standard security measures to protect your data, but we cannot guarantee absolute security. You acknowledge that you provide your data at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Service Availability</h2>
                <div className="space-y-3 text-slate-300">
                  <p className="leading-relaxed">
                    We strive to provide 99.9% uptime but do not guarantee uninterrupted access to the Service. We may:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Perform scheduled maintenance with advance notice</li>
                    <li>Suspend the Service for emergency maintenance</li>
                    <li>Modify or discontinue features with reasonable notice</li>
                    <li>Limit or suspend access for violation of these Terms</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Third-Party Services</h2>
                <p className="text-slate-300 leading-relaxed">
                  The Service may integrate with third-party services (payment processors, SMS providers, etc.). Your use of such services is subject to their respective terms and conditions. We are not responsible for the actions or policies of third-party services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
                <div className="space-y-3 text-slate-300">
                  <p className="leading-relaxed">
                    To the maximum extent permitted by law, OxyManager shall not be liable for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                    <li>Loss of profits, revenue, data, or business opportunities</li>
                    <li>Service interruptions or data loss</li>
                    <li>Unauthorized access to or alteration of your data</li>
                    <li>Actions or content of third-party services</li>
                  </ul>
                  <p className="mt-4 leading-relaxed">
                    Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Indemnification</h2>
                <p className="text-slate-300 leading-relaxed">
                  You agree to indemnify and hold harmless OxyManager, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Termination</h2>
                <div className="space-y-3 text-slate-300">
                  <p className="leading-relaxed">
                    We may terminate or suspend your account immediately, without prior notice, for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Violation of these Terms</li>
                    <li>Non-payment of fees</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Abuse of the Service or other users</li>
                  </ul>
                  <p className="mt-4 leading-relaxed">
                    Upon termination, your right to use the Service will immediately cease. We will provide you with an opportunity to export your data within 30 days of termination.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">13. Dispute Resolution</h2>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">13.1 Governing Law</h3>
                    <p className="leading-relaxed">
                      These Terms shall be governed by and construed in accordance with the laws of Bangladesh, without regard to its conflict of law provisions.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">13.2 Arbitration</h3>
                    <p className="leading-relaxed">
                      Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in Dhaka, Bangladesh, except where prohibited by law.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">14. Changes to Terms</h2>
                <p className="text-slate-300 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">15. Miscellaneous</h2>
                <div className="space-y-3 text-slate-300">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and OxyManager</li>
                    <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
                    <li><strong>Waiver:</strong> Failure to enforce any right does not constitute a waiver of that right</li>
                    <li><strong>Assignment:</strong> You may not assign these Terms without our consent</li>
                    <li><strong>Force Majeure:</strong> We are not liable for delays caused by circumstances beyond our control</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">16. Contact Information</h2>
                <div className="text-slate-300 space-y-2">
                  <p className="leading-relaxed">For questions about these Terms, please contact us:</p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:legal@oxymanager.com" className="text-cyan-400 hover:text-cyan-300">legal@oxymanager.com</a></p>
                    <p><strong>Support:</strong> <a href="mailto:support@oxymanager.com" className="text-cyan-400 hover:text-cyan-300">support@oxymanager.com</a></p>
                    <p><strong>Phone:</strong> <a href="tel:+8801234567890" className="text-cyan-400 hover:text-cyan-300">+880 1234-567890</a></p>
                    <p><strong>Address:</strong> Dhaka, Bangladesh</p>
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-700 pt-6">
                <p className="text-slate-400 text-sm leading-relaxed">
                  By using OxyManager, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </section>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>•</span>
              <a href="mailto:support@oxymanager.com" className="hover:text-white transition-colors">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
