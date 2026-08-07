/**
 * The analytics report, laid out for print.
 *
 * `printSheet` renders one table, which is right for a list but wrong for this:
 * an analytics report is a sequence of small tables under headings — sales,
 * costs, receivables, stock, what to act on. So this builds its own document
 * with the same header, fonts and print rules, and hands it to the browser's
 * PDF writer for correct Bangla.
 */

import type { AnalyticsOverview } from "@/lib/analytics";

export interface ReportSection {
  heading: string;
  note?: string;
  head: string[];
  rows: (string | number)[][];
  /** Column indexes to right-align. */
  numeric?: number[];
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

interface ReportOptions {
  title: string;
  periodLabel: string;
  storeName?: string;
  cards: { label: string; value: string; tone?: "pos" | "neg" }[];
  sections: ReportSection[];
  verdict?: { text: string; tone: "pos" | "neg" };
}

export function printAnalyticsReport({
  title,
  periodLabel,
  storeName,
  cards,
  sections,
  verdict,
}: ReportOptions) {
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return false;

  const origin = window.location.origin;
  const today = new Date().toLocaleDateString("bn-BD-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cardHtml = cards
    .map(
      (card) => `<div class="card">
        <div class="card-label">${escapeHtml(card.label)}</div>
        <div class="card-value ${card.tone ?? ""}">${escapeHtml(card.value)}</div>
      </div>`
    )
    .join("");

  const sectionHtml = sections
    .filter((section) => section.rows.length > 0)
    .map(
      (section) => `<section>
      <h2>${escapeHtml(section.heading)}</h2>
      ${section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : ""}
      <table>
        <thead><tr>${section.head
          .map(
            (h, i) =>
              `<th${section.numeric?.includes(i) ? ' class="num"' : ""}>${escapeHtml(
                h
              )}</th>`
          )
          .join("")}</tr></thead>
        <tbody>${section.rows
          .map(
            (row) =>
              `<tr>${row
                .map(
                  (cell, i) =>
                    `<td${
                      section.numeric?.includes(i) ? ' class="num"' : ""
                    }>${escapeHtml(cell)}</td>`
                )
                .join("")}</tr>`
          )
          .join("")}</tbody>
      </table>
    </section>`
    )
    .join("");

  win.document.write(`<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} — ${escapeHtml(periodLabel)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Inter", "Hind Siliguri", system-ui, sans-serif;
    color: #0f172a; margin: 0; font-size: 11px; line-height: 1.5;
  }
  header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #0891b2;
  }
  header img { height: 42px; }
  .meta { text-align: right; font-size: 10px; color: #64748b; }
  .meta strong { display: block; font-size: 15px; color: #0f172a; }
  .cards {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 8px; margin: 14px 0 6px;
  }
  .card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
  .card-label { font-size: 9.5px; color: #64748b; }
  .card-value { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .card-value.pos { color: #059669; }
  .card-value.neg { color: #e11d48; }
  .verdict {
    margin: 10px 0 4px; padding: 8px 12px; border-radius: 6px;
    border: 1px solid #e2e8f0; font-weight: 600;
  }
  .verdict.pos { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
  .verdict.neg { background: #fff1f2; border-color: #fecdd3; color: #9f1239; }
  section { margin-top: 16px; page-break-inside: avoid; }
  h2 {
    font-size: 12px; margin: 0 0 6px; padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0; color: #0f172a;
  }
  .note { margin: 0 0 6px; font-size: 10px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; font-size: 10px; font-weight: 600; color: #475569;
    background: #f8fafc; padding: 6px 8px; border-bottom: 1px solid #e2e8f0;
  }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  tbody tr:last-child td { border-bottom: 0; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  footer {
    margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0;
    font-size: 9.5px; color: #94a3b8; display: flex;
    justify-content: space-between;
  }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <header>
    <img src="${origin}/logo.png" alt="">
    <div class="meta">
      <strong>${escapeHtml(title)}</strong>
      ${escapeHtml(periodLabel)}<br>
      ${storeName ? escapeHtml(storeName) + " · " : ""}${today}
    </div>
  </header>

  <div class="cards">${cardHtml}</div>
  ${
    verdict
      ? `<div class="verdict ${verdict.tone}">${escapeHtml(verdict.text)}</div>`
      : ""
  }
  ${sectionHtml}

  <footer>
    <span>${storeName ? escapeHtml(storeName) : "OxyManager"}</span>
    <span>${today}</span>
  </footer>
</body>
</html>`);
  win.document.close();

  // Wait for the webfont and the logo, or the print dialog captures a page with
  // fallback glyphs and an empty image box.
  const start = () => {
    const done = () => {
      win.focus();
      win.print();
    };
    const fonts = (win.document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(() => setTimeout(done, 120));
    } else {
      setTimeout(done, 500);
    }
  };
  if (win.document.readyState === "complete") start();
  else win.addEventListener("load", start);
  return true;
}

/** Turns one analytics payload into the sections above. */
export function buildAnalyticsSections(
  data: AnalyticsOverview,
  money: (value: number) => string
): ReportSection[] {
  const sections: ReportSection[] = [];

  sections.push({
    heading: "বিক্রি ও লাভ",
    head: ["কী", "এই সময়ে", "আগের সময়ে", "পরিবর্তন"],
    numeric: [1, 2, 3],
    rows: [
      [
        "বিক্রি",
        money(data.sales.revenue),
        money(data.comparison?.revenue?.previous ?? 0),
        `${data.comparison?.revenue?.change_pct ?? 0}%`,
      ],
      ["বিক্রির লাভ", money(data.sales.gross_profit), "—", "—"],
      ["অর্ডার", String(data.sales.orders_count), "—", "—"],
    ],
  });

  if (data.costs?.by_category?.length) {
    sections.push({
      heading: "খরচের ভাঙন",
      note: `সব মিলিয়ে ${money(data.costs.total)}`,
      head: ["খাত", "টাকা", "মোট খরচের"],
      numeric: [1, 2],
      rows: data.costs.by_category.map((row) => [
        row.label,
        money(row.amount),
        data.costs.total
          ? `${Math.round((row.amount / data.costs.total) * 1000) / 10}%`
          : "—",
      ]),
    });
  }

  if (data.restock?.length) {
    sections.push({
      heading: "কোন মাল আরও আনতে হবে",
      note: "14 দিনের স্টক ধরে হিসাব",
      head: ["প্রোডাক্ট", "বিক্রি", "স্টকে", "আর কত দিন", "কত পিস আনবেন"],
      numeric: [1, 2, 3, 4],
      rows: data.restock.map((row) => [
        row.name,
        `${row.sold} পিস`,
        String(row.in_stock),
        `${row.days_left} দিন`,
        `${row.suggest_qty} পিস`,
      ]),
    });
  }

  if (data.dead_stock?.length) {
    sections.push({
      heading: "এই সময়ে একটাও বিক্রি হয়নি",
      head: ["প্রোডাক্ট", "স্টক", "আটকে আছে"],
      numeric: [1, 2],
      rows: data.dead_stock.map((row) => [
        row.name,
        String(row.stock),
        money(row.tied_up),
      ]),
    });
  }

  if (data.focus?.length) {
    sections.push({
      heading: "কোথায় নজর দিতে হবে",
      head: ["বিষয়", "কী হয়েছে", "কী করবেন"],
      rows: data.focus.map((item) => [item.title, item.detail, item.action]),
    });
  }

  return sections;
}
