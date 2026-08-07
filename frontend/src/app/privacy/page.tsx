'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-sm font-bold text-white">
              O
            </span>
            <span className="text-base font-semibold text-slate-900">OxyManager</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>হোমে ফিরে যান</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto w-full max-w-[72ch] px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            প্রাইভেসি পলিসি
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">সর্বশেষ আপডেট: ২৮ জানুয়ারি, ২০২৬</p>
        </header>

        <article className="space-y-8 text-[0.9375rem] leading-relaxed text-slate-600">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১. শুরুর কথা</h2>
            <p>
              Welcome to OxyManager (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our business management software and services.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">২. আমরা কী কী তথ্য নিই</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">২.১ ব্যক্তিগত তথ্য</h3>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>Name, email address, and phone number</li>
                  <li>Business information (company name, address, tax ID)</li>
                  <li>Payment information (processed securely through third-party payment processors)</li>
                  <li>Account credentials (username and encrypted password)</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">২.২ ব্যবসার ডাটা</h3>
                <p>When you use our services, we collect:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>Product and inventory information</li>
                  <li>Customer and supplier data</li>
                  <li>Sales and transaction records</li>
                  <li>Financial data (banking transactions, invoices)</li>
                  <li>Employee information (if using HR features)</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">২.৩ ব্যবহারের তথ্য</h3>
                <p>We automatically collect certain information about your device and usage:</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>IP address, browser type, and operating system</li>
                  <li>Pages visited, features used, and time spent</li>
                  <li>Device information and unique identifiers</li>
                  <li>Log data and error reports</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৩. তথ্য দিয়ে আমরা কী করি</h2>
            <p>We use the collected information for:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Providing, maintaining, and improving our services</li>
              <li>Processing transactions and sending notifications</li>
              <li>Responding to your requests and providing customer support</li>
              <li>Sending administrative information, updates, and security alerts</li>
              <li>Analyzing usage patterns to enhance user experience</li>
              <li>Detecting and preventing fraud, abuse, and security incidents</li>
              <li>Complying with legal obligations and enforcing our terms</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৪. ডাটার নিরাপত্তা</h2>
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Bank-grade encryption (SSL/TLS) for data transmission</li>
              <li>Encrypted data storage with regular backups</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection practices</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৫. তথ্য কার সাথে শেয়ার করা হয়</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate our services (payment processors, SMS providers, cloud hosting)</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৬. আপনার অধিকার</h2>
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your business data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain processing of your information</li>
            </ul>
            <p className="mt-3">
              এই অধিকারগুলো কাজে লাগাতে চাইলে আমাদের লিখুন <a href="mailto:privacy@oxymanager.com" className="text-cyan-600 hover:text-cyan-700">privacy@oxymanager.com</a>
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৭. ডাটা কতদিন রাখা হয়</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, and fraud prevention purposes, typically for up to 7 years as required by Bangladeshi law.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৮. দেশের বাইরে ডাটা পাঠানো</h2>
            <p>
              Your information may be transferred to and processed in countries other than Bangladesh. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৯. শিশুদের গোপনীয়তা</h2>
            <p>
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১০. কুকি আর ট্র্যাকিং</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookies through your browser settings, but disabling them may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১১. পলিসি বদলানো</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through our service. Your continued use of OxyManager after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১২. যোগাযোগ</h2>
            <p>এই পলিসি নিয়ে কিছু জানার থাকলে আমাদের সাথে যোগাযোগ করুন:</p>
            <div className="mt-3 space-y-1.5">
              <p><strong>ইমেইল:</strong> <a href="mailto:privacy@oxymanager.com" className="text-cyan-600 hover:text-cyan-700">privacy@oxymanager.com</a></p>
              <p><strong>ফোন:</strong> <a href="tel:+8801234567890" className="text-cyan-600 hover:text-cyan-700">+880 1234-567890</a></p>
              <p><strong>ঠিকানা:</strong> ঢাকা, বাংলাদেশ</p>
            </div>
          </section>
        </article>

        {/* Footer Links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-900">
            শর্তাবলি
          </Link>
          <span aria-hidden="true">•</span>
          <Link href="/" className="hover:text-slate-900">
            হোম
          </Link>
          <span aria-hidden="true">•</span>
          <a href="mailto:support@oxymanager.com" className="hover:text-slate-900">
            সাপোর্টে যোগাযোগ
          </a>
        </div>
      </div>
    </div>
  );
}
