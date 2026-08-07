# OxyManager — Design & Language Contract

Every page, dialog and component in `frontend/src` follows this document.
No screen is exempt. If a screen needs something not listed here, extend
`app/globals.css` first, then use the new class — never inline a one-off colour.

---

## 1. Look & feel

A **single-plane financial app** (think QuickBooks / Stripe dashboard), not a
card gallery.

- **One white plane per page.** Content is divided into sections by 1px
  hairlines, not by stacked cards with shadows.
- **No nested cards.** A card inside a card inside a card is the #1 thing we are
  removing. If you see `rounded-xl border shadow` wrappers nested, flatten them.
- **Depth comes from spacing and hairlines**, not shadows/gradients. Shadows are
  reserved for dialogs and dropdowns only.
- Numbers are the hero: tabular figures, right-aligned in tables, generous
  breathing room around totals.

### Palette (already defined as CSS vars in `globals.css`)

| Token | Value | Use |
|---|---|---|
| `--background` | `#f8fafc` | page canvas |
| `--surface` | `#ffffff` | the plane, dialogs |
| `--surface-muted` | `#f1f5f9` | table headers, dialog footers |
| `--border` | `#e2e8f0` | every hairline |
| `--foreground` | `#0f172a` | headings, key figures |
| `--text-secondary` | `#475569` | body text, table cells |
| `--text-muted` | `#64748b` | labels, captions |
| `--primary` | `#0891b2` (cyan-600) | primary action, links, active nav |
| `--success` | `#047857` | money in, positive delta, active status |
| `--danger` | `#e11d48` | money out, destructive, overdue |
| `--warning` | `#b45309` | low stock, pending |

Tailwind equivalents: `bg-slate-50` canvas, `bg-white` plane,
`border-slate-200` hairlines, `text-slate-900 / -600 / -500` text ladder,
`text-cyan-600` primary. **Never** use `-300`/`-400` text weights (they wash
out on white) and never use `slate-700/800/900` as a background.

---

## 2. Class vocabulary (from `globals.css`)

```
Page       .page  .page-head  .page-title  .page-sub
Plane      .plane  .plane-section  .section-title
KPIs       .stat-strip > .stat > .stat-label / .stat-value / .stat-meta
Numbers    .num  .money-pos  .money-neg
Table      .tbl-wrap > .tbl   +  .cell-strong  .cell-num
Forms      .label  .input  .select  .textarea
Buttons    .btn .btn-primary | .btn-ghost | .btn-danger | .btn-sm
Badges     .badge .badge-success|-warn|-danger|-info|-muted
Dialog     .modal-backdrop > .modal > .modal-head/.modal-body/.modal-foot
Empty      .empty
```

### Page skeleton — copy this shape

```tsx
<div className="page">
  <header className="page-head">
    <div>
      <h1 className="page-title">কাস্টমার</h1>
      <p className="page-sub">ক্রেতাদের তালিকা আর বাকির হিসাব</p>
    </div>
    <button className="btn btn-primary">
      <Plus className="h-4 w-4" /> নতুন কাস্টমার
    </button>
  </header>

  <div className="plane">
    {/* KPIs: one hairline-divided strip, NOT three cards */}
    <div className="stat-strip">
      <div className="stat">
        <div className="stat-label">মোট কাস্টমার</div>
        <div className="stat-value num">১০</div>
        <div className="stat-meta">সব মিলিয়ে</div>
      </div>
      {/* ...more .stat */}
    </div>

    {/* Filters live in their own section of the SAME plane */}
    <div className="plane-section">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন" />
        <select className="select w-auto"> ... </select>
      </div>
    </div>

    {/* Table sits flush in the plane — no inner border/rounding */}
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr><th>কাস্টমার</th><th>যোগাযোগ</th><th className="cell-num">বাকি</th><th>অবস্থা</th><th></th></tr>
        </thead>
        <tbody>
          <tr>
            <td className="cell-strong">আলী আহমেদ</td>
            <td>০১৭xxxxxxxx</td>
            <td className="cell-num money-neg">৳১২,৫০০</td>
            <td><span className="badge badge-success">সক্রিয়</span></td>
            <td className="text-right">…actions…</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### Dialog skeleton

```tsx
<div className="modal-backdrop" onClick={close}>
  <div className="modal" onClick={(e) => e.stopPropagation()}>
    <div className="modal-head">
      <h2 className="modal-title">কাস্টমার ডিলিট করবেন?</h2>
      <button onClick={close} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
    </div>
    <div className="modal-body">
      <p className="text-sm text-slate-600">…</p>
    </div>
    <div className="modal-foot">
      <button className="btn btn-ghost" onClick={close}>বাতিল</button>
      <button className="btn btn-danger">ডিলিট করুন</button>
    </div>
  </div>
</div>
```

---

## 3. Sizing, readability, responsiveness

### Typeface — same pairing as adsyclub.com

`Inter` + `Hind Siliguri`, loaded via `next/font` in `app/layout.tsx` (self-hosted,
no request to Google, no layout shift). Inter carries Latin and figures; it has no
Bangla glyphs, so the browser falls through to Hind Siliguri for Bangla.

- **Never name a font family in a component.** Use `var(--font-app)` or the
  `font-sans` utility — both resolve to the same stack.
- The next/font `.variable` classes go on `<html>`, **not** `<body>`: `--font-app`
  is declared on `:root`, and a `var()` inside a custom property resolves on the
  element that declares it. On `<body>` those lookups fail and the whole app
  silently drops to the Tailwind default stack.
- The Django admin mirrors the stack through `--oxm-font` in `oxm-jazzmin.css`
  (there it comes from Google Fonts, since Django has no next/font).

- Base font 14px. Page title 20–22px/600. Section label 12px uppercase.
  Table text 13px. Never below 11px.
- Controls: inputs/buttons 36px tall (`.btn`, `.input`), small variants 32px.
- Touch targets ≥ 32px. Icon-only buttons get `aria-label`.
- Tables **must** be wrapped in `.tbl-wrap` (horizontal scroll on mobile) and
  never force the page to scroll sideways.
- Grids: `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-4`. Test at 360px.
- Truncate long text with `truncate` + `title`, don't let it break layout.

---

## 4. Language — colloquial Bangla everywhere

All user-visible text is **everyday spoken Bangla** (কথ্য ভাষা), not stiff
literary Bangla. Keep widely-used English business words as-is in Bangla script
(কাস্টমার, অর্ডার, স্টক, ইনভয়েস) — that is how shopkeepers actually speak.

- **Prefer the spoken loanword over the formal Bangla word** — this is how
  shopkeepers actually talk. Confirmed swaps, keep using these:

  | ✗ literary | ✓ spoken |
  |---|---|
  | পণ্য | প্রোডাক্ট |
  | বাছুন / নির্বাচন করুন | সিলেক্ট করুন |
  | সব ধরন | সব রকম |
  | ধরন (type of X) | টাইপ |
  | নামছে | ডাউনলোড হচ্ছে |
  | মুছুন | মুছে দিন / ডিলিট করুন |
  | পারস্পরিক | mutual |
  | ইতিহাস / হিসাব *(a log of past events)* | হিস্ট্রি |
  | সম্পন্ন | কমপ্লিট |
  | অপেক্ষমাণ *(money still owed)* | বাকি আছে |
  | অপেক্ষমাণ *(job not done yet)* | পেন্ডিং |
  | আপনি কি নিশ্চিত? | সত্যিই …করবেন? |

  Also keep as loanwords: ক্যাটাগরি, স্টক, অর্ডার, ইনভয়েস, ব্যালেন্স,
  কাস্টমার, সাপ্লায়ার, ভ্যারিয়েন্ট.
- **হিসাব is only for the accounting sense.** A list of what already happened is
  a হিস্ট্রি (পাঠানোর হিস্ট্রি, কেনাকাটার হিস্ট্রি, স্টকের হিস্ট্রি). Keep হিসাব where it
  really means a sum or a ledger entry — বিলের হিসাব, হিসাব-নিকাশ, আনুমানিক হিসাব,
  নতুন হিসাব যোগ করুন.
- Do **not** translate: brand names (OxyManager), currency codes, units (SKU).
- Numbers/currency stay in the app's existing formatter; don't hand-convert digits
  in code — only literal UI strings are translated.
- Error/success toasts also get Bangla.

### Glossary — use these exact words everywhere

| English | বাংলা |
|---|---|
| Dashboard | ড্যাশবোর্ড |
| Products / Inventory | প্রোডাক্ট / স্টক |
| Sales / Orders | বিক্রি / অর্ডার |
| Customers | কাস্টমার |
| Suppliers | সাপ্লায়ার |
| Banking | ব্যাংকিং |
| Due Book | বাকির খাতা |
| Employees | কর্মচারী |
| SMS Center | এসএমএস সেন্টার |
| Notebook | নোটবুক |
| Subscriptions | সাবস্ক্রিপশন |
| Settings | সেটিংস |
| Add / New | যোগ করুন / নতুন |
| Edit | এডিট করুন |
| Delete | ডিলিট করুন |
| Save | সেভ করুন |
| Cancel | বাতিল |
| Search | খুঁজুন |
| Filter | ফিল্টার |
| Total | মোট |
| Amount | টাকার পরিমাণ |
| Price | দাম |
| Quantity | পরিমাণ |
| Stock | স্টক |
| Due | বাকি |
| Paid | পরিশোধ |
| Status | অবস্থা |
| Active / Inactive | সক্রিয় / নিষ্ক্রিয় |
| Pending | অপেক্ষমাণ |
| Loading… | লোড হচ্ছে… |
| No data found | কিছু পাওয়া যায়নি |
| Are you sure? | আপনি কি নিশ্চিত? |
| Something went wrong | কিছু একটা সমস্যা হয়েছে |

---

## 5. Rules of the sweep

1. Keep **all logic, hooks, API calls, state and behaviour** exactly as-is.
   This is a presentation + copy change only.
2. Replace card-in-card structures with `.plane` + `.plane-section`.
3. Replace ad-hoc button/input/badge classes with the vocabulary above.
4. Translate every user-visible string to colloquial Bangla.
5. Leave `console.log`, comments and variable names in English.
6. The file must still compile — no unused imports left behind.
