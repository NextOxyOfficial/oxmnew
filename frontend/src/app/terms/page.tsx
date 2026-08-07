'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
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
            শর্তাবলি
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">সর্বশেষ আপডেট: ২৮ জানুয়ারি, ২০২৬</p>
        </header>

        <article className="space-y-8 text-[0.9375rem] leading-relaxed text-slate-600">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১. শর্ত মেনে নেওয়া</h2>
            <p>
              By accessing or using OxyManager (&quot;Service&quot;, &quot;Platform&quot;, &quot;Software&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">২. সার্ভিস কী</h2>
            <p>
              OxyManager is a comprehensive business management software platform that provides tools for inventory management, sales tracking, customer relationship management, banking integration, SMS marketing, and related business operations. The Service is provided on a subscription basis with different pricing tiers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৩. ইউজার অ্যাকাউন্ট</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৩.১ অ্যাকাউন্ট খোলা</h3>
                <p>
                  To use the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৩.২ অ্যাকাউন্টের নিরাপত্তা</h3>
                <p>
                  You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized access or security breach.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৩.৩ কারা ব্যবহার করতে পারবেন</h3>
                <p>
                  You must be at least 18 years old and legally capable of entering into binding contracts to use the Service. By using the Service, you represent and warrant that you meet these requirements.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৪. সাবস্ক্রিপশন আর পেমেন্ট</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৪.১ সাবস্ক্রিপশন প্ল্যান</h3>
                <p>
                  We offer various subscription plans (Free, Pro, Enterprise) with different features and limitations. Subscription fees are billed in advance on a monthly or annual basis.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৪.২ ফ্রি ট্রায়াল</h3>
                <p>
                  We offer a 14-day free trial for Pro plans. No credit card is required for the trial. After the trial period, your subscription will automatically convert to a paid plan unless you cancel.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৪.৩ পেমেন্টের নিয়ম</h3>
                <p>
                  Payment is due at the beginning of each billing cycle. We accept bKash, Nagad, credit/debit cards, and other payment methods. All fees are non-refundable except as required by law or as explicitly stated in these Terms.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৪.৪ দাম বদলানো</h3>
                <p>
                  We reserve the right to modify subscription fees. We will provide at least 30 days&apos; notice of any price changes. Continued use after the price change constitutes acceptance of the new pricing.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৪.৫ বাতিল করা</h3>
                <p>
                  You may cancel your subscription at any time. Cancellation will be effective at the end of your current billing period. You will retain access to paid features until the end of the billing period.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৫. ইউজারের দায়িত্ব</h2>
            <p>You agree to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
              <li>Not use the Service in any way that violates applicable laws or regulations</li>
              <li>Not engage in any conduct that restricts or inhibits anyone&apos;s use of the Service</li>
              <li>Not attempt to gain unauthorized access to any portion of the Service</li>
              <li>Not transmit any viruses, malware, or other malicious code</li>
              <li>Not use the Service to send spam or unsolicited communications</li>
              <li>Maintain the security and confidentiality of your account credentials</li>
              <li>Comply with all applicable data protection and privacy laws</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৬. মেধাস্বত্ব</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৬.১ আমাদের সম্পত্তি</h3>
                <p>
                  The Service and its original content, features, and functionality are owned by OxyManager and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৬.২ আপনার ডাটা</h3>
                <p>
                  You retain all rights to the data you input into the Service. By using the Service, you grant us a limited license to use, store, and process your data solely for the purpose of providing the Service to you.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">৬.৩ মতামত</h3>
                <p>
                  Any feedback, suggestions, or ideas you provide to us regarding the Service become our property, and we may use them without any obligation to you.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৭. ডাটার গোপনীয়তা আর নিরাপত্তা</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy. We implement industry-standard security measures to protect your data, but we cannot guarantee absolute security. You acknowledge that you provide your data at your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৮. সার্ভিস চালু থাকা</h2>
            <p>
              We strive to provide 99.9% uptime but do not guarantee uninterrupted access to the Service. We may:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Perform scheduled maintenance with advance notice</li>
              <li>Suspend the Service for emergency maintenance</li>
              <li>Modify or discontinue features with reasonable notice</li>
              <li>Limit or suspend access for violation of these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">৯. তৃতীয় পক্ষের সার্ভিস</h2>
            <p>
              The Service may integrate with third-party services (payment processors, SMS providers, etc.). Your use of such services is subject to their respective terms and conditions. We are not responsible for the actions or policies of third-party services.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১০. দায়ের সীমা</h2>
            <p>
              To the maximum extent permitted by law, OxyManager shall not be liable for:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions or data loss</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Actions or content of third-party services</li>
            </ul>
            <p className="mt-3">
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১১. ক্ষতিপূরণ</h2>
            <p>
              You agree to indemnify and hold harmless OxyManager, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১২. অ্যাকাউন্ট বন্ধ করা</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice, for:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Violation of these Terms</li>
              <li>Non-payment of fees</li>
              <li>Fraudulent or illegal activity</li>
              <li>Abuse of the Service or other users</li>
            </ul>
            <p className="mt-3">
              Upon termination, your right to use the Service will immediately cease. We will provide you with an opportunity to export your data within 30 days of termination.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১৩. ঝামেলা মেটানো</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">১৩.১ প্রযোজ্য আইন</h3>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of Bangladesh, without regard to its conflict of law provisions.
                </p>
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">১৩.২ সালিশ</h3>
                <p>
                  Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in Dhaka, Bangladesh, except where prohibited by law.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১৪. শর্ত বদলানো</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১৫. অন্যান্য</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and OxyManager</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
              <li><strong>Waiver:</strong> Failure to enforce any right does not constitute a waiver of that right</li>
              <li><strong>Assignment:</strong> You may not assign these Terms without our consent</li>
              <li><strong>Force Majeure:</strong> We are not liable for delays caused by circumstances beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">১৬. যোগাযোগ</h2>
            <p>শর্তাবলি নিয়ে কিছু জানার থাকলে আমাদের সাথে যোগাযোগ করুন:</p>
            <div className="mt-3 space-y-1.5">
              <p><strong>ইমেইল:</strong> <a href="mailto:legal@oxymanager.com" className="text-cyan-600 hover:text-cyan-700">legal@oxymanager.com</a></p>
              <p><strong>সাপোর্ট:</strong> <a href="mailto:support@oxymanager.com" className="text-cyan-600 hover:text-cyan-700">support@oxymanager.com</a></p>
              <p><strong>ফোন:</strong> <a href="tel:+8801234567890" className="text-cyan-600 hover:text-cyan-700">+880 1234-567890</a></p>
              <p><strong>ঠিকানা:</strong> ঢাকা, বাংলাদেশ</p>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">
              OxyManager ব্যবহার করার মানে আপনি এই শর্তাবলি পড়েছেন, বুঝেছেন আর মেনে নিয়েছেন।
            </p>
          </section>
        </article>

        {/* Footer Links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-900">
            প্রাইভেসি পলিসি
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
