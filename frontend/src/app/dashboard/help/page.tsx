'use client';

import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Settings,
  CreditCard,
  Package,
  AlertCircle
} from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: 'general' | 'orders' | 'billing' | 'technical';
}

const faqData: FAQ[] = [
  {
    id: 1,
    question: "পাসওয়ার্ড ভুলে গেলে কী করব?",
    answer: "প্রোফাইল সেটিংসে গিয়ে 'পাসওয়ার্ড বদলান' এ ক্লিক করুন। আগের পাসওয়ার্ড দিয়ে নতুন পাসওয়ার্ডটা দুইবার লিখলেই হয়ে যাবে।",
    category: 'general'
  },
  {
    id: 2,
    question: "অর্ডার কোথায় আছে দেখব কীভাবে?",
    answer: "ড্যাশবোর্ডের অর্ডার পেজ থেকে সব অর্ডার দেখতে পারবেন। প্রতিটা অর্ডারের এখনকার অবস্থা আর কবে পৌঁছাবে সেটা ওখানেই লেখা থাকে।",
    category: 'orders'
  },
  {
    id: 3,
    question: "কোন কোন উপায়ে টাকা দেওয়া যায়?",
    answer: "সব বড় কার্ড (Visa, MasterCard, American Express), PayPal আর ব্যাংক ট্রান্সফার নেওয়া হয়। সব পেমেন্ট নিরাপদভাবেই হয়।",
    category: 'billing'
  },
  {
    id: 4,
    question: "বিলিংয়ের তথ্য কীভাবে বদলাব?",
    answer: "সেটিংস > বিলিং এ গিয়ে পেমেন্ট মাধ্যম, বিলিং ঠিকানা বদলাতে পারবেন আর আগের পেমেন্টের হিস্ট্রিও দেখতে পারবেন।",
    category: 'billing'
  },
  {
    id: 5,
    question: "অ্যাকাউন্টে ঢুকতে পারছি না",
    answer: "লগইনে সমস্যা হলে ব্রাউজারের ক্যাশ আর কুকি মুছে আবার চেষ্টা করুন। তাতেও না হলে আমাদের সাপোর্ট টিমে যোগাযোগ করুন।",
    category: 'technical'
  },
  {
    id: 6,
    question: "অর্ডার বাতিল করব কীভাবে?",
    answer: "অর্ডার দেওয়ার 24 ঘণ্টার ভেতরে বাতিল করা যায়। অর্ডার পেজে গিয়ে অর্ডারটা খুঁজে বের করে 'অর্ডার বাতিল' বাটনে ক্লিক করুন, অপশনটা থাকলে কাজ হবে।",
    category: 'orders'
  },
  {
    id: 7,
    question: "ইমেইল ঠিকানা বদলাতে পারব?",
    answer: "হ্যাঁ, প্রোফাইল সেটিংস থেকে ইমেইল বদলাতে পারবেন। নতুন ইমেইলটা ভেরিফাই করার পরেই পরিবর্তনটা কাজ করবে।",
    category: 'general'
  },
  {
    id: 8,
    question: "আমার ডেটা ডাউনলোড করব কীভাবে?",
    answer: "সেটিংস > ডেটা এক্সপোর্ট থেকে অর্ডারের হিসাব, কাস্টমারের তথ্য আর বাকি সব ডেটা নামিয়ে নিতে পারবেন।",
    category: 'technical'
  }
];

const categories = [
  { id: 'all', name: 'সব বিষয়', icon: HelpCircle },
  { id: 'general', name: 'সাধারণ', icon: Users },
  { id: 'orders', name: 'অর্ডার', icon: Package },
  { id: 'billing', name: 'বিলিং', icon: CreditCard },
  { id: 'technical', name: 'টেকনিক্যাল', icon: Settings }
];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = selectedCategory === 'all'
    ? faqData
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">সাহায্য আর সাপোর্ট</h1>
          <p className="page-sub">সাধারণ প্রশ্নের উত্তর দেখুন, না মিললে আমাদের জানান</p>
        </div>
      </header>

      <div className="plane">
        {/* Contact channels */}
        <div className="plane-section">
          <div className="section-title">যোগাযোগ</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">ফোনে কথা বলুন</p>
                <p className="text-sm text-slate-600 num">+1 (555) 123-4567</p>
                <p className="text-xs text-slate-500">শনি–বৃহস্পতি, সকাল 9টা – সন্ধ্যা 6টা</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">ইমেইল করুন</p>
                <p className="truncate text-sm text-slate-600" title="support@oxm.com">support@oxm.com</p>
                <p className="text-xs text-slate-500">24 ঘণ্টার ভেতরে উত্তর পাবেন</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">অফিসের ঠিকানা</p>
                <p className="text-sm text-slate-600">
                  123 বিজনেস স্ট্রিট, স্যুট 456<br />
                  নিউ ইয়র্ক, NY 10001
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Business hours */}
        <div className="plane-section">
          <div className="section-title">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> খোলা থাকার সময়
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">শনি – বৃহস্পতি</span>
              <span className="num text-slate-900">সকাল 9টা – সন্ধ্যা 6টা</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">শুক্রবার</span>
              <span className="num text-slate-900">সকাল 10টা – বিকেল 4টা</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">সরকারি ছুটি</span>
              <span className="text-slate-900">বন্ধ</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="plane-section">
          <div className="section-title">
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> যেসব প্রশ্ন সবাই করে
            </span>
          </div>

          {/* Category filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`btn btn-sm ${selectedCategory === category.id ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ list */}
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {filteredFaqs.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-cyan-600"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {faq.question}
                  </span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="pb-3 text-sm text-slate-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="empty">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              এই বিষয়ে এখনো কোনো প্রশ্ন যোগ করা হয়নি।
            </div>
          )}
        </div>

        {/* Emergency contact */}
        <div className="plane-section">
          <div className="section-title">জরুরি সাপোর্ট</div>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
            <div>
              <p className="text-sm text-slate-600">
                ব্যবসা আটকে যাচ্ছে এমন জরুরি সমস্যা হলে সরাসরি জরুরি লাইনে ফোন করুন।
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
                <div>
                  <p className="text-xs font-medium text-slate-500">জরুরি হটলাইন</p>
                  <p className="num text-sm text-slate-900">+1 (555) 999-HELP (4357)</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">কখন পাওয়া যাবে</p>
                  <p className="text-sm text-slate-900">দিনরাত 24 ঘণ্টা, জরুরি সমস্যার জন্য</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
