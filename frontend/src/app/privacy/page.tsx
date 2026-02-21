'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-slate-400 text-lg">Last updated: January 28, 2026</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                <p className="text-slate-300 leading-relaxed">
                  Welcome to OxyManager (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business management software and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">2.1 Personal Information</h3>
                    <p className="leading-relaxed">We collect information that you provide directly to us, including:</p>
                    <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                      <li>Name, email address, and phone number</li>
                      <li>Business information (company name, address, tax ID)</li>
                      <li>Payment information (processed securely through third-party payment processors)</li>
                      <li>Account credentials (username and encrypted password)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">2.2 Business Data</h3>
                    <p className="leading-relaxed">When you use our services, we collect:</p>
                    <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                      <li>Product and inventory information</li>
                      <li>Customer and supplier data</li>
                      <li>Sales and transaction records</li>
                      <li>Financial data (banking transactions, invoices)</li>
                      <li>Employee information (if using HR features)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">2.3 Usage Information</h3>
                    <p className="leading-relaxed">We automatically collect certain information about your device and usage:</p>
                    <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
                      <li>IP address, browser type, and operating system</li>
                      <li>Pages visited, features used, and time spent</li>
                      <li>Device information and unique identifiers</li>
                      <li>Log data and error reports</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                <div className="space-y-3 text-slate-300">
                  <p className="leading-relaxed">We use the collected information for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Providing, maintaining, and improving our services</li>
                    <li>Processing transactions and sending notifications</li>
                    <li>Responding to your requests and providing customer support</li>
                    <li>Sending administrative information, updates, and security alerts</li>
                    <li>Analyzing usage patterns to enhance user experience</li>
                    <li>Detecting and preventing fraud, abuse, and security incidents</li>
                    <li>Complying with legal obligations and enforcing our terms</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
                <p className="text-slate-300 leading-relaxed">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3 ml-4 text-slate-300">
                  <li>Bank-grade encryption (SSL/TLS) for data transmission</li>
                  <li>Encrypted data storage with regular backups</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Employee training on data protection practices</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing and Disclosure</h2>
                <div className="space-y-3 text-slate-300">
                  <p className="leading-relaxed">We do not sell your personal information. We may share your information with:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> Third-party vendors who help us operate our services (payment processors, SMS providers, cloud hosting)</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                    <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights and Choices</h2>
                <div className="space-y-3 text-slate-300">
                  <p className="leading-relaxed">You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of your personal information</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Export:</strong> Download your business data in a portable format</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                    <li><strong>Object:</strong> Object to certain processing of your information</li>
                  </ul>
                  <p className="mt-4 leading-relaxed">
                    To exercise these rights, contact us at <a href="mailto:privacy@oxymanager.com" className="text-cyan-400 hover:text-cyan-300">privacy@oxymanager.com</a>
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                <p className="text-slate-300 leading-relaxed">
                  We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, and fraud prevention purposes, typically for up to 7 years as required by Bangladeshi law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. International Data Transfers</h2>
                <p className="text-slate-300 leading-relaxed">
                  Your information may be transferred to and processed in countries other than Bangladesh. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Children&apos;s Privacy</h2>
                <p className="text-slate-300 leading-relaxed">
                  Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Cookies and Tracking</h2>
                <p className="text-slate-300 leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookies through your browser settings, but disabling them may affect functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
                <p className="text-slate-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through our service. Your continued use of OxyManager after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                <div className="text-slate-300 space-y-2">
                  <p className="leading-relaxed">If you have questions about this Privacy Policy, please contact us:</p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:privacy@oxymanager.com" className="text-cyan-400 hover:text-cyan-300">privacy@oxymanager.com</a></p>
                    <p><strong>Phone:</strong> <a href="tel:+8801234567890" className="text-cyan-400 hover:text-cyan-300">+880 1234-567890</a></p>
                    <p><strong>Address:</strong> Dhaka, Bangladesh</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
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
