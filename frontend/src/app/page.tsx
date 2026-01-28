'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Globe,
  Smartphone,
  Building2,
  ChevronRight,
  Play,
  Menu,
  X,
} from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track products, variants, stock levels with real-time alerts for low stock items.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ShoppingCart,
      title: 'Sales & Orders',
      description: 'Process sales, manage orders, generate invoices with complete transaction history.',
      color: 'from-emerald-500 to-green-500',
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Maintain customer database, track purchase history, manage due payments.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: CreditCard,
      title: 'Banking & Finance',
      description: 'Multi-account banking, transaction tracking, financial reports and analytics.',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: MessageSquare,
      title: 'SMS Marketing',
      description: 'Bulk SMS campaigns, automated notifications, customer engagement tools.',
      color: 'from-rose-500 to-red-500',
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'Comprehensive dashboards, sales reports, inventory insights, profit analysis.',
      color: 'from-indigo-500 to-violet-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Businesses' },
    { value: '৳50Cr+', label: 'Transactions Processed' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '24/7', label: 'Customer Support' },
  ];

  const testimonials = [
    {
      name: 'Rahim Uddin',
      business: 'Fashion House BD',
      image: '/testimonials/user1.jpg',
      quote: 'OxyManager transformed how we manage our clothing business. Stock tracking is now effortless!',
      rating: 5,
    },
    {
      name: 'Fatima Akter',
      business: 'Grocery Mart',
      image: '/testimonials/user2.jpg',
      quote: 'The SMS feature helped us increase repeat customers by 40%. Amazing tool for small businesses.',
      rating: 5,
    },
    {
      name: 'Kamal Hossain',
      business: 'Electronics Plus',
      image: '/testimonials/user3.jpg',
      quote: 'Finally a business software that understands Bangladeshi businesses. The due book feature is a lifesaver!',
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '০',
      period: '/মাস',
      description: 'ছোট ব্যবসার জন্য পারফেক্ট',
      features: [
        'Up to 100 Products',
        'Basic Inventory Management',
        'Sales & Order Tracking',
        'Customer Database',
        '50 SMS Credits/month',
        'Email Support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Pro',
      price: '৯৯৯',
      period: '/মাস',
      description: 'Growing businesses এর জন্য',
      features: [
        'Unlimited Products',
        'Advanced Inventory',
        'Multi-user Access',
        'Banking Integration',
        '500 SMS Credits/month',
        'Priority Support',
        'Custom Reports',
        'API Access',
      ],
      cta: 'Start Pro Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Large organizations এর জন্য',
      features: [
        'Everything in Pro',
        'Unlimited Users',
        'Dedicated Server',
        'Custom Integrations',
        'Unlimited SMS',
        'Dedicated Account Manager',
        'On-premise Option',
        'SLA Guarantee',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                <span className="text-slate-900 font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                OxyManager
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
                Pricing
              </a>
              <a href="#testimonials" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
                Reviews
              </a>
              <a href="#faq" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
                FAQ
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {loading ? (
                <div className="animate-pulse h-10 w-24 bg-slate-800 rounded-lg"></div>
              ) : isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium px-4 py-2"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-slate-300 hover:text-white py-2">Features</a>
              <a href="#pricing" className="block text-slate-300 hover:text-white py-2">Pricing</a>
              <a href="#testimonials" className="block text-slate-300 hover:text-white py-2">Reviews</a>
              <a href="#faq" className="block text-slate-300 hover:text-white py-2">FAQ</a>
              <div className="pt-4 border-t border-slate-800 space-y-3">
                {isAuthenticated ? (
                  <Link href="/dashboard" className="block w-full text-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold rounded-lg">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="block w-full text-center text-slate-300 py-2">Sign in</Link>
                    <Link href="/auth/register" className="block w-full text-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold rounded-lg">
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 to-emerald-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-slate-300">বাংলাদেশের #1 Business Management Software</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              আপনার ব্যবসা
              <span className="block bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                সহজে ম্যানেজ করুন
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Inventory, Sales, Customers, Banking, SMS - সব এক জায়গায়। 
              ছোট থেকে বড় সব ব্যবসার জন্য complete business management solution।
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth/register"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-bold rounded-xl transition-all duration-300 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2"
              >
                ফ্রি শুরু করুন
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none"></div>
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-cyan-500/10">
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center text-xs text-slate-500">oxymanager.com/dashboard</div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 aspect-video flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-slate-900" />
                  </div>
                  <p className="text-slate-400">Interactive Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800/50 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything you need to
              <span className="block bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                run your business
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Powerful features designed specifically for Bangladeshi businesses. 
              Simple to use, yet powerful enough for any scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'Bank-grade Security' },
              { icon: Globe, label: 'Access Anywhere' },
              { icon: Smartphone, label: 'Mobile Friendly' },
              { icon: Clock, label: 'Real-time Sync' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
                <item.icon className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              শুরু করুন মাত্র <span className="text-cyan-400">৩ ধাপে</span>
            </h2>
            <p className="text-slate-400 text-lg">Simple setup, powerful results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up Free',
                description: 'Create your account in 30 seconds. No credit card needed.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Add Your Products',
                description: 'Import or manually add your inventory. Set prices and stock levels.',
                icon: Package,
              },
              {
                step: '03',
                title: 'Start Selling',
                description: 'Process sales, track customers, and grow your business.',
                icon: TrendingUp,
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent -translate-x-1/2"></div>
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 mb-6">
                    <item.icon className="w-10 h-10 text-cyan-400" />
                  </div>
                  <div className="text-cyan-400 font-mono text-sm mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by <span className="text-emerald-400">10,000+</span> businesses
            </h2>
            <p className="text-slate-400 text-lg">See what our customers have to say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border transition-all duration-500 ${
                  index === activeTestimonial
                    ? 'bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 scale-105'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-900 font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.business}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeTestimonial ? 'bg-cyan-400 w-6' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, transparent <span className="text-cyan-400">pricing</span>
            </h2>
            <p className="text-slate-400 text-lg">Start free, upgrade when you need</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border-cyan-500/50 scale-105 shadow-2xl shadow-cyan-500/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === 'Enterprise' ? '#contact' : '/auth/register'}
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:from-cyan-400 hover:to-emerald-400'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently Asked <span className="text-cyan-400">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'OxyManager কি ফ্রি?',
                a: 'হ্যাঁ! আমাদের Free plan দিয়ে শুরু করতে পারবেন। ১০০টি প্রোডাক্ট পর্যন্ত ম্যানেজ করতে পারবেন বিনামূল্যে।',
              },
              {
                q: 'আমার ডাটা কি সুরক্ষিত?',
                a: 'অবশ্যই! আমরা bank-grade encryption ব্যবহার করি এবং আপনার ডাটা নিয়মিত backup নেওয়া হয়।',
              },
              {
                q: 'মোবাইল থেকে ব্যবহার করা যাবে?',
                a: 'হ্যাঁ, OxyManager সম্পূর্ণ mobile responsive। যেকোনো device থেকে access করতে পারবেন।',
              },
              {
                q: 'SMS credit কিভাবে কিনবো?',
                a: 'Dashboard থেকে Subscriptions এ গিয়ে SMS packages দেখতে পাবেন। bKash/Nagad/Card দিয়ে কিনতে পারবেন।',
              },
              {
                q: 'Support কিভাবে পাবো?',
                a: 'Free users email support পাবেন। Pro users priority support এবং live chat access পাবেন।',
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-all"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-white">{faq.q}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-4 text-slate-400 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to grow your business?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join 10,000+ businesses already using OxyManager. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-bold rounded-xl transition-all duration-300 shadow-2xl shadow-cyan-500/25"
              >
                Start Free Trial
              </Link>
              <Link
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-700"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-sm">O</span>
                </div>
                <span className="text-lg font-bold">OxyManager</span>
              </div>
              <p className="text-slate-400 text-sm">
                Complete business management solution for Bangladeshi businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} OxyManager. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
