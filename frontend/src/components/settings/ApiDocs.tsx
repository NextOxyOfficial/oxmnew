"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { getApiUrl } from "@/lib/api";

/**
 * The public API reference.
 *
 * Written for someone building a storefront on another domain, so it covers the
 * whole loop — read the catalogue, post an order back, read the order's status —
 * not just the product list. Every snippet is copy-ready with the reader's own
 * base URL already filled in.
 */

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  what: string;
}

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/products/", what: "স্টোরের সব প্রোডাক্টের তালিকা" },
  { method: "GET", path: "/products/{id}/", what: "একটা প্রোডাক্টের বিস্তারিত" },
  { method: "POST", path: "/orders/", what: "নতুন অর্ডার বানান (স্টক নিজে থেকেই কমবে)" },
  { method: "GET", path: "/orders/{order_number}/", what: "অর্ডারের অবস্থা দেখুন" },
];

const FILTERS = [
  ["category__name", "ক্যাটাগরির নাম দিয়ে ফিল্টার করুন"],
  ["has_variants", "ভ্যারিয়েন্ট আছে কিনা (true/false)"],
  ["is_active", "Active কিনা (true/false)"],
  ["page", "কত নম্বর পাতা"],
  ["page_size", "এক পাতায় কয়টা (সর্বোচ্চ ৫০০)"],
];

const ERRORS = [
  ["401", "কী ভুল, নেই, বা বন্ধ করা আছে"],
  ["403", "এই কী দিয়ে ওই জিনিসে হাত দেওয়া যাবে না"],
  ["404", "প্রোডাক্ট বা অর্ডারটা এই স্টোরে নেই"],
  ["400", "রিকোয়েস্টে ভুল আছে — `error` ঘরে কারণ লেখা থাকে"],
  ["429", "রিকোয়েস্টের লিমিট পার হয়ে গেছে, একটু পরে আবার চেষ্টা করুন"],
];

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard is blocked on insecure origins — the code is still selectable. */
    }
  };

  return (
    <div className="relative mb-4 rounded-lg border border-slate-200 bg-slate-50">
      {label && (
        <div className="border-b border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label="কোডটা কপি করুন"
        className="absolute right-2 top-2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre className="overflow-x-auto px-3 py-3 text-xs leading-relaxed text-slate-700">
        {code}
      </pre>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h6 className="mb-2 mt-6 text-sm font-semibold text-slate-900 first:mt-0">
      {children}
    </h6>
  );
}

export default function ApiDocs() {
  // Taken from the same helper every request uses, so the snippets point at
  // the real backend — the page's own origin is the frontend, a different port
  // in development.
  const api = `${getApiUrl().replace(/\/+$/, "")}/public`;

  return (
    <div className="plane-section">
      <div className="section-title">API দিয়ে কী কী করা যাবে</div>

      <p className="mb-4 text-sm text-slate-600">
        এই কী দিয়ে যেকোনো ওয়েবসাইট বা অ্যাপ আপনার স্টোরের প্রোডাক্ট দেখাতে পারবে,
        আর সেখান থেকেই অর্ডার বানাতে পারবে — ঠিক ই-কমার্সের মতো। অর্ডার হলে স্টক
        নিজে থেকেই কমে যাবে আর বিক্রির খাতায় উঠে যাবে।
      </p>

      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        কী-টা কেবল সার্ভারে রাখুন। ব্রাউজারের কোডে বসালে যে কেউ দেখে ফেলবে আর
        আপনার স্টোরে অর্ডার বানাতে পারবে।
      </div>

      <Heading>বেস URL</Heading>
      <CodeBlock code={api + "/"} />

      <Heading>অথেনটিকেশন</Heading>
      <p className="mb-2 text-sm text-slate-500">
        প্রতিটা রিকোয়েস্টের হেডারে কী-টা এভাবে পাঠান:
      </p>
      <CodeBlock code="Authorization: Bearer আপনার_api_key" />

      <Heading>যেসব এন্ডপয়েন্ট আছে</Heading>
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="tbl">
          <thead>
            <tr>
              <th>মেথড</th>
              <th>ঠিকানা</th>
              <th>কী করে</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((row) => (
              <tr key={`${row.method}-${row.path}`}>
                <td>
                  <span
                    className={`badge font-mono ${
                      row.method === "POST" ? "badge-warn" : "badge-success"
                    }`}
                  >
                    {row.method}
                  </span>
                </td>
                <td>
                  <code className="text-xs text-cyan-700">{row.path}</code>
                </td>
                <td className="text-slate-600">{row.what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading>১. প্রোডাক্টের তালিকা আনুন</Heading>
      <CodeBlock
        label="রিকোয়েস্ট"
        code={`curl "${api}/products/?page_size=20" \\
  -H "Authorization: Bearer আপনার_api_key"`}
      />
      <CodeBlock
        label="উত্তর"
        code={`{
  "count": 103,
  "next": "${api}/products/?page=2",
  "results": [
    {
      "id": 100,
      "name": "Deluxe Gadget 100",
      "category_name": "Electronics",
      "has_variants": false,
      "sell_price": "708.01",
      "stock": 429,
      "main_photo": "https://…/products/100/photos/a1b2.jpg",
      "variants": [],
      "is_active": true
    }
  ]
}`}
      />

      <Heading>২. অর্ডার বানান</Heading>
      <p className="mb-2 text-sm text-slate-500">
        দাম আপনার স্টোরের রেকর্ড থেকেই নেওয়া হয় — রিকোয়েস্টে দাম পাঠালেও সেটা
        মানা হবে না, তাই কেউ নিজের ইচ্ছেমতো দামে কিনতে পারবে না।
      </p>
      <CodeBlock
        label="রিকোয়েস্ট"
        code={`curl -X POST "${api}/orders/" \\
  -H "Authorization: Bearer আপনার_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "product_id": 100, "quantity": 2 },
      { "product_id": 112, "variant_id": 47, "quantity": 1 }
    ],
    "customer": {
      "name": "করিম মিয়া",
      "phone": "+8801700000001",
      "email": "karim@example.com",
      "address": "কুষ্টিয়া"
    },
    "paid_amount": 0,
    "discount_amount": 0,
    "notes": "ওয়েবসাইট থেকে"
  }'`}
      />
      <CodeBlock
        label="উত্তর — 201 Created"
        code={`{
  "id": 57,
  "order_number": "ORD202608070004",
  "status": "pending",
  "subtotal": "1416.02",
  "total_amount": "1416.02",
  "paid_amount": "0",
  "due_amount": "1416.02",
  "customer": { "name": "করিম মিয়া", "phone": "+8801700000001" },
  "items": [
    {
      "product_id": 100,
      "product_name": "Deluxe Gadget 100",
      "quantity": 2,
      "unit_price": "708.01",
      "total_price": "1416.02"
    }
  ],
  "created_at": "2026-08-07T09:45:02Z"
}`}
      />

      <div className="mb-4 space-y-1.5 text-sm">
        <p className="text-slate-600">যা মনে রাখবেন:</p>
        <div className="text-slate-500">
          • <code className="text-cyan-700">variant_id</code> দিতে হবে যদি প্রোডাক্টের
          ভ্যারিয়েন্ট থাকে
        </div>
        <div className="text-slate-500">
          • ফোন নম্বর দিলে কাস্টমার নিজে থেকেই যোগ হয়ে যায়; আগে থেকে থাকলে সেই
          কাস্টমারেই অর্ডারটা বসে, নতুন করে বানায় না
        </div>
        <div className="text-slate-500">
          • স্টকে না থাকলে অর্ডার হবে না — <code className="text-cyan-700">400</code>{" "}
          উত্তরে কতটা বাকি আছে লেখা থাকবে
        </div>
        <div className="text-slate-500">
          • এক অর্ডারে সর্বোচ্চ ১০০টা আইটেম
        </div>
      </div>

      <Heading>৩. অর্ডারের অবস্থা দেখুন</Heading>
      <CodeBlock
        code={`curl "${api}/orders/ORD202608070004/" \\
  -H "Authorization: Bearer আপনার_api_key"`}
      />

      <Heading>ফিল্টার করার অপশন</Heading>
      <div className="mb-4 space-y-1 text-sm">
        {FILTERS.map(([name, what]) => (
          <div key={name}>
            <code className="text-cyan-700">{name}</code> —{" "}
            <span className="text-slate-500">{what}</span>
          </div>
        ))}
      </div>

      <Heading>ভুল হলে কী উত্তর আসে</Heading>
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="tbl">
          <thead>
            <tr>
              <th>কোড</th>
              <th>মানে</th>
            </tr>
          </thead>
          <tbody>
            {ERRORS.map(([code, what]) => (
              <tr key={code}>
                <td>
                  <code className="text-xs font-semibold text-rose-600">{code}</code>
                </td>
                <td className="text-slate-600">{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CodeBlock
        label="ভুলের উত্তর সবসময় এই আকারে আসে"
        code={`{ "error": "Only 3 left of Deluxe Gadget 100." }`}
      />

      <Heading>কতবার কল করা যাবে</Heading>
      <p className="text-sm text-slate-500">
        উপরে আপনার কী-র সাথে ঘণ্টায় আর দিনে কতবার কল করা যাবে লেখা আছে। সীমা পার
        হলে <code className="text-rose-600">429</code> আসবে — তখন কিছুক্ষণ থেমে
        আবার চেষ্টা করলেই হবে।
      </p>
    </div>
  );
}
