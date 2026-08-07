'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Hero from '@/components/home/Hero';
import FeatureRows from '@/components/home/FeatureRows';
import Reveal from '@/components/home/Reveal';
import TestimonialSlider from '@/components/home/TestimonialSlider';
import {
  AdvancedSection,
  ComparisonSection,
  IndustriesSection,
  SafetySection,
} from '@/components/home/CommercialSections';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Globe,
  Smartphone,
  ChevronRight,
  Phone,
  Mail,
  Menu,
  X,
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const features = [
    {
      icon: Package,
      title: 'প্রোডাক্ট ও স্টক',
      description: 'প্রোডাক্ট, ভ্যারিয়েন্ট আর স্টকের হিসাব এক জায়গায়। স্টক কমে গেলে সাথে সাথেই খবর পাবেন।',
    },
    {
      icon: ShoppingCart,
      title: 'বিক্রি ও অর্ডার',
      description: 'বিক্রি করুন, অর্ডার সামলান, ইনভয়েস বানান — পুরো লেনদেনের হিসাব সেভ থাকে।',
    },
    {
      icon: Users,
      title: 'কাস্টমার',
      description: 'কাস্টমারের তালিকা, কেনাকাটার হিস্ট্রি আর বাকির হিসাব সবসময় হাতের কাছে।',
    },
    {
      icon: CreditCard,
      title: 'ব্যাংকিং',
      description: 'একাধিক অ্যাকাউন্ট, প্রতিটি লেনদেনের হিসাব আর টাকার রিপোর্ট এক জায়গায়।',
    },
    {
      icon: MessageSquare,
      title: 'এসএমএস সেন্টার',
      description: 'একসাথে অনেক কাস্টমারকে এসএমএস, অটো নোটিফিকেশন আর অফারের খবর পাঠান।',
    },
    {
      icon: BarChart3,
      title: 'রিপোর্ট',
      description: 'ড্যাশবোর্ড, বিক্রির রিপোর্ট, স্টকের হিসাব আর লাভ-ক্ষতির পুরো চিত্র।',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active ব্যবসা' },
    { value: '৳11 কোটি+', label: 'লেনদেন হয়েছে' },
    { value: '99.9%', label: 'আপটাইম' },
    { value: '24/7', label: 'সাপোর্ট' },
  ];

  const testimonials = [
    {
      name: 'রহিম উদ্দিন',
      business: 'ফ্যাশন হাউস বিডি',
      quote: 'OxyManager আসার পর কাপড়ের ব্যবসার হিসাব রাখা অনেক সহজ হয়ে গেছে। স্টক মেলানো নিয়ে আর ঝামেলা নেই।',
      rating: 5,
    },
    {
      name: 'ফাতেমা আক্তার',
      business: 'গ্রোসারি মার্ট',
      quote: 'এসএমএস সেন্টার দিয়ে পুরোনো কাস্টমারদের খবর দিই। এতে বিক্রি 40% বেড়েছে।',
      rating: 5,
    },
    {
      name: 'কামাল হোসেন',
      business: 'ইলেকট্রনিকস প্লাস',
      quote: 'অবশেষে এমন একটা সফটওয়্যার পেলাম যেটা আমাদের দেশের ব্যবসা বোঝে। বাকির খাতাটা তো জীবন বাঁচিয়ে দিয়েছে।',
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'ফ্রি',
      price: '0',
      period: '/মাস',
      description: 'ছোট ব্যবসার জন্য পারফেক্ট',
      features: [
        '25টি প্রোডাক্ট পর্যন্ত',
        'স্টকের সাধারণ হিসাব',
        'বিক্রি ও অর্ডার ট্র্যাকিং',
        'কাস্টমারের তালিকা',
        'মাসে 50টি এসএমএস',
        'ইমেইল সাপোর্ট',
      ],
      cta: 'ফ্রি শুরু করুন',
      popular: false,
    },
    {
      name: 'প্রো',
      price: '399',
      period: '/মাস',
      description: 'বাড়তে থাকা ব্যবসার জন্য',
      features: [
        'যত খুশি প্রোডাক্ট',
        'স্টকের বিস্তারিত হিসাব',
        'একাধিক ইউজার',
        'ব্যাংকিং যোগ করা',
        'মাসে 500টি এসএমএস',
        'অগ্রাধিকার সাপোর্ট',
        'নিজের মতো রিপোর্ট',
        'API অ্যাক্সেস',
      ],
      cta: 'প্রো নিন',
      popular: true,
    },
    {
      name: 'এন্টারপ্রাইজ',
      price: 'কাস্টম',
      period: '',
      description: 'বড় প্রতিষ্ঠানের জন্য',
      features: [
        'প্রো-এর সবকিছু',
        'যত খুশি ইউজার',
        'আলাদা সার্ভার',
        'নিজের মতো ইন্টিগ্রেশন',
        'যত খুশি এসএমএস',
        'নিজস্ব অ্যাকাউন্ট ম্যানেজার',
        'অন-প্রিমাইজ সুবিধা',
        'SLA নিশ্চয়তা',
      ],
      cta: 'কথা বলুন',
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
    <div className="min-h-screen overflow-x-clip text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-2">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              {/* The full lockup already contains the wordmark and tagline, so
                  no separate text is needed beside it. */}
              <Image
                src="/logo.png"
                alt="OxyManager — Your Smart Assistant"
                width={378}
                height={96}
                className="h-11 w-auto sm:h-12"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-7 md:flex">
              <a href="#industries" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                কাদের জন্য
              </a>
              <a href="#features" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                ফিচার
              </a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                দাম
              </a>
              <a href="#faq" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                প্রশ্ন-উত্তর
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden items-center gap-2 md:flex">
              {loading ? (
                <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100"></div>
              ) : isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="btn btn-primary">
                    ড্যাশবোর্ড
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    className="btn btn-ghost"
                  >
                    লগআউট
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-ghost">
                    লগইন
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary">
                    ফ্রি শুরু করুন
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="space-y-1 px-4 py-3">
              <a href="#industries" className="block py-2 text-sm text-slate-600 hover:text-slate-900">কাদের জন্য</a>
              <a href="#features" className="block py-2 text-sm text-slate-600 hover:text-slate-900">ফিচার</a>
              <a href="#pricing" className="block py-2 text-sm text-slate-600 hover:text-slate-900">দাম</a>
              <a href="#testimonials" className="block py-2 text-sm text-slate-600 hover:text-slate-900">রিভিউ</a>
              <a href="#faq" className="block py-2 text-sm text-slate-600 hover:text-slate-900">প্রশ্ন-উত্তর</a>
              <div className="space-y-2 border-t border-slate-200 pt-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="btn btn-primary w-full">
                      ড্যাশবোর্ড
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        router.push('/');
                        setMobileMenuOpen(false);
                      }}
                      className="btn btn-ghost w-full"
                    >
                      লগআউট
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn btn-ghost w-full">লগইন</Link>
                    <Link href="/auth/register" className="btn btn-primary w-full">
                      ফ্রি শুরু করুন
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <Hero />

      {/* Stats — a light band, so the figures read as part of the page. */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-2">
          <div className="grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal key={index} delay={index * 70}>
                <div className="text-center">
                  <div className="num bg-gradient-to-br from-cyan-600 to-emerald-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative overflow-hidden py-8 lg:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_50%,transparent_100%)]"
        />
        <div className="relative mx-auto max-w-7xl px-2">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              ব্যবসা চালাতে যা যা লাগে,
              <span className="block text-cyan-600">সবই এখানে আছে</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              বাংলাদেশের ব্যবসার কথা ভেবেই বানানো। ব্যবহার করা সহজ, তবু যেকোনো মাপের ব্যবসার জন্য যথেষ্ট।
            </p>
          </div>

          <div className="plane">
            <div className="grid grid-cols-1 gap-px bg-slate-200 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Reveal key={index} delay={(index % 3) * 70}>
                <div className="group h-full bg-white p-6 transition-colors hover:bg-slate-50/60">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-600/20 transition-transform group-hover:scale-105">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </div>
                </Reveal>
              ))}
            </div>

            {/* Additional Features */}
            <div className="plane-section">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Shield, label: 'ব্যাংকের মতো নিরাপত্তা' },
                  { icon: Globe, label: 'যেকোনো জায়গা থেকে' },
                  { icon: Smartphone, label: 'মোবাইলেও চলে' },
                  { icon: Clock, label: 'সাথে সাথে আপডেট' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <item.icon className="h-4 w-4 flex-shrink-0 text-cyan-600" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <FeatureRows />

      <IndustriesSection />

      <AdvancedSection />

      <section className="bg-white py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-2">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              শুরু করুন মাত্র <span className="text-cyan-600">3 ধাপে</span>
            </h2>
            <p className="mt-3 text-slate-600">সেটআপ সহজ, ফল সাথে সাথেই</p>
          </div>

          <div className="plane">
            <div className="grid grid-cols-1 gap-px bg-slate-200 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'ফ্রি অ্যাকাউন্ট খুলুন',
                  description: '30 সেকেন্ডেই অ্যাকাউন্ট তৈরি। কোনো কার্ড লাগবে না।',
                  icon: Users,
                },
                {
                  step: '02',
                  title: 'প্রোডাক্ট যোগ করুন',
                  description: 'প্রোডাক্টের তালিকা ইমপোর্ট করুন বা হাতে লিখুন। দাম আর স্টক বসিয়ে দিন।',
                  icon: Package,
                },
                {
                  step: '03',
                  title: 'বিক্রি শুরু করুন',
                  description: 'বিক্রি করুন, কাস্টমারের হিসাব রাখুন, ব্যবসা বাড়ান।',
                  icon: TrendingUp,
                },
              ].map((item, index) => (
                <div key={index} className="bg-white p-6 text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-cyan-600">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div className="num text-xs font-semibold tracking-wider text-cyan-600">{item.step}</div>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <ComparisonSection />

      <SafetySection />

      {/* ── what people say ─────────────────────────────────────── */}
      <section id="testimonials" className="relative overflow-hidden py-8 lg:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_50%,transparent_100%)]"
        />
        <div className="relative mx-auto max-w-7xl px-2">
          <Reveal>
            <div className="mb-8 text-center">
              <span className="mb-3 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                রিভিউ
              </span>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                10,000+ ব্যবসায়ীর
                <span className="block text-cyan-600">ভরসা</span>
              </h2>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <TestimonialSlider />
          </Reveal>
        </div>
      </section>

      <section id="pricing" className="bg-white py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-2">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              সহজ আর <span className="text-cyan-600">পরিষ্কার দাম</span>
            </h2>
            <p className="mt-3 text-slate-600">ফ্রি দিয়ে শুরু করুন, দরকার হলে বাড়িয়ে নিন</p>
          </div>

          <div className="plane mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-px bg-slate-200 md:grid-cols-3">
              {pricingPlans.map((plan, index) => (
                <div key={index} className={`flex flex-col p-6 ${plan.popular ? 'bg-slate-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                    {plan.popular && <span className="badge badge-info">সবচেয়ে জনপ্রিয়</span>}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="num text-3xl font-semibold tracking-tight text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

                  <ul className="mt-5 mb-6 flex-1 space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.name === 'এন্টারপ্রাইজ' ? '#contact' : '/auth/register'}
                    className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-8 lg:py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              যা প্রায়ই <span className="text-cyan-600">জিজ্ঞেস করা হয়</span>
            </h2>
          </div>

          <div className="plane">
            {[
              {
                q: 'OxyManager কি ফ্রি?',
                a: 'হ্যাঁ! ফ্রি প্ল্যান দিয়েই শুরু করতে পারবেন। বিনামূল্যে 25টি প্রোডাক্ট পর্যন্ত ম্যানেজ করা যাবে।',
              },
              {
                q: 'আমার ডাটা কি সুরক্ষিত?',
                a: 'অবশ্যই। ব্যাংকের মতো এনক্রিপশন ব্যবহার করি আর আপনার ডাটার নিয়মিত ব্যাকআপ রাখা হয়।',
              },
              {
                q: 'মোবাইল থেকে ব্যবহার করা যাবে?',
                a: 'হ্যাঁ, OxyManager মোবাইলেও পুরোপুরি চলে। যেকোনো ডিভাইস থেকেই ঢুকতে পারবেন।',
              },
              {
                q: 'এসএমএস ক্রেডিট কীভাবে কিনবো?',
                a: 'ড্যাশবোর্ডের সাবস্ক্রিপশন থেকে এসএমএস প্যাকেজ দেখতে পাবেন। বিকাশ, নগদ বা কার্ড দিয়ে কিনতে পারবেন।',
              },
              {
                q: 'সাপোর্ট কীভাবে পাবো?',
                a: 'ফ্রি ইউজাররা ইমেইল সাপোর্ট পাবেন। প্রো ইউজাররা অগ্রাধিকার সাপোর্ট আর লাইভ চ্যাট পাবেন।',
              },
            ].map((faq, index) => (
              <details key={index} className="plane-section group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-900">{faq.q}</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="bg-white py-8 lg:py-10">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            ব্যবসা বাড়ানোর জন্য তৈরি?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            10,000+ ব্যবসায়ী এখন OxyManager ব্যবহার করছেন। ফ্রি অ্যাকাউন্ট খুলে আজই শুরু করুন।
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/register" className="btn btn-primary w-full sm:w-auto">
              ফ্রি অ্যাকাউন্ট খুলুন
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:support@oxymanager.com" className="btn btn-ghost w-full sm:w-auto">
              কথা বলুন
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Footer — the dark band closes the page the way the stats opened it,
          so the whole thing reads as one designed surface. */}
      <footer className="relative overflow-hidden bg-slate-900 text-slate-400">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_50%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-48 w-full max-w-[40rem] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-2 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 inline-block">
                {/* A dedicated white-on-transparent asset. logo.png has an
                    opaque white background, so a CSS invert filter painted the
                    whole rectangle white instead of just the mark. */}
                <Image
                  src="/logo-white.png"
                  alt="OxyManager — Your Smart Assistant"
                  width={757}
                  height={192}
                  className="h-10 w-auto"
                />
              </Link>
              <p className="mb-5 text-sm leading-relaxed">
                বাংলাদেশের ব্যবসার জন্য পুরো হিসাব-নিকাশের ব্যবস্থা। স্টক থেকে
                বেতন — সব এক জায়গায়।
              </p>
              <div className="space-y-2.5 text-sm">
                <a
                  href="tel:+8801234567890"
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  +880 1234-567890
                </a>
                <a
                  href="mailto:support@oxymanager.com"
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">support@oxymanager.com</span>
                </a>
              </div>
            </div>

            {[
              {
                heading: 'প্রোডাক্ট',
                links: [
                  { label: 'কাদের জন্য', href: '#industries' },
                  { label: 'ফিচার', href: '#features' },
                  { label: 'অ্যাডভান্সড ফিচার', href: '#advanced' },
                  { label: 'দাম', href: '#pricing' },
                ],
              },
              {
                heading: 'কোম্পানি',
                links: [
                  { label: 'রিভিউ', href: '#testimonials' },
                  { label: 'প্রশ্ন-উত্তর', href: '#faq' },
                  { label: 'যোগাযোগ', href: '#contact' },
                  { label: 'সাপোর্ট', href: 'mailto:support@oxymanager.com' },
                ],
              },
            ].map((column) => (
              <div key={column.heading}>
                <h3 className="mb-3 text-sm font-semibold text-white">
                  {column.heading}
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="transition-colors hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">শর্তাবলি & পলিসি</h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/privacy" className="transition-colors hover:text-white">প্রাইভেসি পলিসি</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-white">শর্তাবলি</Link></li>
              </ul>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-semibold text-white">শুরু করতে চান?</p>
                <Link
                  href="/auth/register"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cyan-500"
                >
                  ফ্রি অ্যাকাউন্ট খুলুন
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row">
            <p>&copy; {new Date().getFullYear()} OxyManager. সর্বস্বত্ব সংরক্ষিত।</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="transition-colors hover:text-white">প্রাইভেসি</Link>
              <span aria-hidden="true">•</span>
              <Link href="/terms" className="transition-colors hover:text-white">শর্তাবলি</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
