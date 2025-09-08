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
  AlertCircle,
  ExternalLink
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
    question: "How do I reset my password?",
    answer: "Go to your profile settings and click on 'Change Password'. You'll need to enter your current password and then your new password twice to confirm.",
    category: 'general'
  },
  {
    id: 2,
    question: "How can I track my orders?",
    answer: "You can track all your orders from the Orders page in your dashboard. Each order shows its current status and estimated delivery date.",
    category: 'orders'
  },
  {
    id: 3,
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely.",
    category: 'billing'
  },
  {
    id: 4,
    question: "How do I update my billing information?",
    answer: "Navigate to Settings > Billing to update your payment methods, billing address, and view your payment history.",
    category: 'billing'
  },
  {
    id: 5,
    question: "I'm having trouble accessing my account",
    answer: "If you're having login issues, try clearing your browser cache and cookies. If the problem persists, contact our support team.",
    category: 'technical'
  },
  {
    id: 6,
    question: "How do I cancel an order?",
    answer: "Orders can be cancelled within 24 hours of placement. Go to your Orders page, find the order, and click 'Cancel Order' if the option is available.",
    category: 'orders'
  },
  {
    id: 7,
    question: "Can I change my email address?",
    answer: "Yes, you can update your email address in your profile settings. You'll need to verify the new email address before the change takes effect.",
    category: 'general'
  },
  {
    id: 8,
    question: "How do I export my data?",
    answer: "You can export your order history, customer data, and other information from the Settings > Data Export section.",
    category: 'technical'
  }
];

const categories = [
  { id: 'all', name: 'All Topics', icon: HelpCircle },
  { id: 'general', name: 'General', icon: Users },
  { id: 'orders', name: 'Orders', icon: Package },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'technical', name: 'Technical', icon: Settings }
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
    <div className="min-h-screen bg-slate-900">
      {/* Header Section */}
      <div className="bg-slate-800/50 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-100 mb-4">
              Help & Support Center
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our support team
            </p>
          </div>
        </div>
      </div>        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-100 mb-6">Contact Us</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="font-medium text-slate-200">Phone Support</p>
                      <p className="text-slate-300">+1 (555) 123-4567</p>
                      <p className="text-sm text-slate-400">Mon-Fri, 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="font-medium text-slate-200">Email Support</p>
                      <p className="text-slate-300">support@oxm.com</p>
                      <p className="text-sm text-slate-400">Response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="font-medium text-slate-200">Office Address</p>
                      <p className="text-slate-300">
                        123 Business Street<br />
                        Suite 456<br />
                        New York, NY 10001
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                  <Clock className="h-5 w-5 text-cyan-400 mr-2" />
                  Business Hours
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monday - Friday</span>
                    <span className="text-slate-200">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Saturday</span>
                    <span className="text-slate-200">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sunday</span>
                    <span className="text-slate-200">Closed</span>
                  </div>
                </div>
              </div>
            </div>            {/* FAQ Section */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-semibold text-slate-100 mb-6">
                  Frequently Asked Questions
                </h2>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          selectedCategory === category.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600/50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/50"
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-700/50 transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-slate-200 pr-4">
                          {faq.question}
                        </span>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-6 pb-4 text-slate-300 border-t border-slate-700/50 pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredFaqs.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No FAQs found for this category.</p>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8 bg-red-900/30 border border-red-500/30 p-6 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-300 mb-2">Emergency Support</h3>
              <p className="text-red-200 mb-3">
                For urgent technical issues that affect your business operations, contact our emergency support line.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <p className="font-medium text-red-300">Emergency Hotline:</p>
                  <p className="text-red-200">+1 (555) 999-HELP (4357)</p>
                </div>
                <div>
                  <p className="font-medium text-red-300">Available:</p>
                  <p className="text-red-200">24/7 for critical issues</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
