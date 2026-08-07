"use client";

import Link from "next/link";
import Reveal from "@/components/home/Reveal";
import {
  ArrowRight,
  Bike,
  Check,
  Code2,
  Cpu,
  Database,
  Lock,
  Minus,
  Package,
  Pill,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
  Wrench,
  X,
} from "lucide-react";

/**
 * The sections a visitor needs before they will pay.
 *
 * The page already said *what* the software does. These answer the three
 * questions that actually stop someone signing up: is it for a shop like
 * mine, is my money safe in it, and is it really better than the ledger I
 * already have.
 *
 * Kept out of page.tsx, which is long enough already.
 */

const INDUSTRIES = [
  {
    icon: Bike,
    name: "মোটর বাইক শোরুম",
    detail:
      "প্রতি বাইকের ইঞ্জিন-চেসিস নম্বর, কাগজপত্র আর কিস্তির হিসাব আলাদা করে রাখা যায়।",
  },
  {
    icon: Store,
    name: "মুদি ও ডিপার্টমেন্ট স্টোর",
    detail: "শত শত আইটেম, ভ্যারিয়েন্ট আর দ্রুত বিক্রির জন্য বানানো।",
  },
  {
    icon: Smartphone,
    name: "মোবাইল ও ইলেকট্রনিক্স",
    detail: "IMEI বা সিরিয়াল ধরে স্টক, ওয়ারেন্টি আর বাকির হিসাব।",
  },
  {
    icon: Pill,
    name: "ফার্মেসি",
    detail: "ব্যাচ, সাপ্লায়ার আর নিয়মিত কাস্টমারের বাকি — সব এক জায়গায়।",
  },
  {
    icon: Wrench,
    name: "যন্ত্রাংশ ও সার্ভিসিং",
    detail: "পার্টসের কোড, কেনা-বেচার দাম আর কর্মচারীর ইনসেনটিভ।",
  },
  {
    icon: ShoppingBag,
    name: "কাপড় ও জুতার দোকান",
    detail: "রঙ-সাইজ ভ্যারিয়েন্ট, ছাড় আর মৌসুমি বিক্রির রিপোর্ট।",
  },
];

const COMPARISON = [
  ["দিন শেষে লাভ-ক্ষতি জানা", "রাত জেগে হিসাব মেলাতে হয়", "সাথে সাথেই দেখা যায়"],
  ["কার কাছে কত বাকি", "খাতা ঘেঁটে বের করতে হয়", "এক ক্লিকে তালিকা, এসএমএসে তাগাদা"],
  ["কোন মাল শেষ হয়ে আসছে", "চোখে পড়লে তবেই", "আগেই বলে দেয় — কত পিস আনতে হবে"],
  ["কর্মচারীর বেতন ও অগ্রিম", "মুখস্থ বা আলাদা খাতা", "কে কত নিয়েছে, কত বাকি — নিজে থেকেই"],
  ["খাতা হারিয়ে গেলে", "সব হিসাব শেষ", "সার্ভারে থাকে, কিছুই যায় না"],
  ["দোকানে না থাকলে", "কিছুই জানা যায় না", "ফোন থেকেই পুরো দোকান দেখা যায়"],
];

const ADVANCED = [
  {
    icon: Cpu,
    title: "নিজস্ব ব্রেইন সিস্টেম",
    detail:
      "বিক্রি, খরচ আর স্টক দেখে প্রতিদিন বলে দেয় কত বিক্রি করলে খরচ উঠবে, কোন মাল আর কত দিনে ফুরাবে, আর কোথায় নজর দিতে হবে।",
  },
  {
    icon: Users,
    title: "কর্মচারীর লগইন ও অনুমতি",
    detail:
      "প্রতিটা কর্মচারীকে আলাদা লগইন দিন, আর 36টা অনুমতির মধ্যে ঠিক যেগুলো দরকার সেগুলোই টিক দিন। সে শুধু ততটুকুই দেখবে।",
  },
  {
    icon: Code2,
    title: "ডেভেলপারের জন্য API",
    detail:
      "নিজের ওয়েবসাইট বা অ্যাপ থেকে প্রোডাক্ট দেখান আর অর্ডার নিন। অর্ডার হলে স্টক নিজে থেকেই কমে, বিক্রির খাতায় উঠে যায়।",
  },
  {
    icon: Package,
    title: "সিরিয়াল ধরে পণ্য",
    detail:
      "বাইক, মোবাইল বা যেকোনো দামি জিনিস — প্রতি ইউনিটের নম্বর, কাগজপত্র আর কে কিনল সব আলাদা করে রাখা যায়।",
  },
];

const SAFETY = [
  {
    icon: Lock,
    title: "প্রতিটা দোকানের হিসাব আলাদা",
    detail:
      "আপনার তথ্যে আর কেউ পৌঁছাতে পারে না — এমনকি আপনারই কর্মচারী শুধু ততটুকুই দেখে যতটুকু আপনি অনুমতি দিয়েছেন।",
  },
  {
    icon: ShieldCheck,
    title: "এনক্রিপ্টেড সংযোগ",
    detail:
      "সব তথ্য HTTPS দিয়ে যায়। পাসওয়ার্ড কোথাও পড়ার মতো করে রাখা হয় না।",
  },
  {
    icon: Database,
    title: "নিয়মিত ব্যাকআপ",
    detail:
      "ফোন হারালে বা কম্পিউটার নষ্ট হলেও হিসাব থেকে যায় — সবই সার্ভারে জমা।",
  },
];

function SectionHead({
  eyebrow,
  title,
  accent,
  sub,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="mb-10 text-center">
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
        {accent && <span className="block text-cyan-600">{accent}</span>}
      </h2>
      {sub && <p className="mx-auto mt-3 max-w-2xl text-slate-600">{sub}</p>}
    </div>
  );
}

export function IndustriesSection() {
  return (
    <section id="industries" className="relative overflow-hidden py-16 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_50%,transparent_100%)]"
        />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal><SectionHead
          eyebrow="কাদের জন্য"
          title="আপনার দোকানটাও"
          accent="এই তালিকায় আছে"
          sub="একই হিসাব সব ব্যবসায় খাটে না। তাই প্রতিটা ধরনের জন্য আলাদা করে ভাবা হয়েছে।"
        /></Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((row, i) => (
            <Reveal key={row.name} delay={i * 60}>
            <div
              key={row.name}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <row.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">
                {row.name}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">{row.detail}</p>
            </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          আপনার ব্যবসা এখানে নেই?{" "}
          <a
            href="#contact"
            className="font-medium text-cyan-700 hover:underline"
          >
            জানান — দেখে বলে দেব চলবে কি না।
          </a>
        </p>
      </div>
    </section>
  );
}

export function ComparisonSection() {
  return (
    <section className="border-y border-slate-200 bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal><SectionHead
          eyebrow="কেন বদলাবেন"
          title="খাতা-কলম আর"
          accent="OxyManager — পার্থক্যটা এখানে"
          sub="সফটওয়্যার মানেই ভালো নয়। আসল কথা হলো কোন কাজটা কত সহজ হয়।"
        /></Reveal>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  কাজ
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Minus className="h-3.5 w-3.5" />
                    খাতা-কলমে
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-cyan-700">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    OxyManager-এ
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([task, before, after]) => (
                <tr key={task} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {task}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <span className="flex items-start gap-1.5">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                      {before}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      {after}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function AdvancedSection() {
  return (
    <section id="advanced" className="relative overflow-hidden py-16 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_50%,transparent_100%)]"
        />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal><SectionHead
          eyebrow="যা আর কোথাও পাবেন না"
          title="শুধু হিসাব রাখা নয় —"
          accent="ব্যবসাটা বুঝেও নেয়"
          sub="সংখ্যা তো সব সফটওয়্যারই দেখায়। এটা বলে দেয় সংখ্যাগুলো দিয়ে কী করতে হবে।"
        /></Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ADVANCED.map((row, i) => (
            <Reveal key={row.title} delay={i * 70}>
            <div
              key={row.title}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                <row.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">
                  {row.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {row.detail}
                </p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SafetySection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal><SectionHead
          eyebrow="নিরাপত্তা"
          title="আপনার হিসাব"
          accent="আপনার কাছেই থাকে"
          sub="ব্যবসার হিসাব সবচেয়ে গোপন জিনিস। সেটা কোথায় থাকে আর কে দেখতে পায়, সেটা লুকিয়ে রাখার কিছু নেই।"
        /></Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SAFETY.map((row, i) => (
            <Reveal key={row.title} delay={i * 80}>
            <div
              key={row.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <row.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">
                {row.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">{row.detail}</p>
            </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-cyan-200 bg-white p-6 sm:flex-row">
          <div>
            <p className="text-base font-semibold text-slate-900">
              ফ্রি অ্যাকাউন্টে শুরু করুন — কার্ড লাগবে না
            </p>
            <p className="mt-1 text-sm text-slate-600">
              পছন্দ হলে তখন প্রো নেবেন। আগে নয়।
            </p>
          </div>
          <Link
            href="/auth/register"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
          >
            ফ্রি অ্যাকাউন্ট খুলুন
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
