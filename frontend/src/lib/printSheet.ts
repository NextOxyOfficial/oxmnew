/**
 * Print a report through the browser instead of drawing it with jsPDF.
 *
 * jsPDF's built-in fonts are Latin-1 only, so Bangla names came out as
 * mojibake ("†°¿«Å²") and ৳ printed as "ó". Embedding a Bengali TTF would add
 * roughly half a megabyte of base64 to the bundle for one button. The browser
 * already has the fonts and a PDF writer, so the report is rendered as HTML and
 * handed to the print dialog — the user picks "Save as PDF" and gets correct
 * Bangla plus a layout that is far easier to maintain than jsPDF draw calls.
 */

export interface PrintSheetOptions {
  /** Document title — becomes the default filename in the print dialog. */
  title: string;
  subtitle?: string;
  /** Small summary tiles shown above the table. */
  cards?: { label: string; value: string }[];
  head: string[];
  rows: (string | number)[][];
  /** Column indexes that should be right-aligned (money and counts). */
  numericColumns?: number[];
  /** A closing line, e.g. a total. */
  footNote?: string;
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function printSheet({
  title,
  subtitle,
  cards = [],
  head,
  rows,
  numericColumns = [],
  footNote,
}: PrintSheetOptions) {
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) {
    // Pop-up blocked — the caller decides how to tell the user.
    return false;
  }

  const isNum = (index: number) => numericColumns.includes(index);
  // about:blank has no base URL, so the logo needs an absolute path.
  const origin = window.location.origin;
  const today = new Date().toLocaleDateString("bn-BD-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  win.document.write(`<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Inter", "Hind Siliguri", "Segoe UI", sans-serif;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .band {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; padding: 18px 20px 12px;
    border-bottom: 2px solid #0891b2;
  }
  /* The full lockup already carries the wordmark and tagline, so no text
     sits beside it. */
  .brand img { height: 40px; width: auto; display: block; }
  .doc { text-align: right; font-size: 15px; font-weight: 600; color: #0f172a; }
  .doc small { display: block; font-size: 11px; font-weight: 400; color: #64748b; margin-top: 2px; }
  .cards { display: flex; gap: 10px; padding: 16px 20px 0; }
  .card {
    flex: 1; border: 1px solid #e2e8f0; background: #f8fafc;
    border-radius: 8px; padding: 10px 12px;
  }
  .card .k { font-size: 10px; color: #64748b; }
  .card .v { font-size: 15px; font-weight: 600; margin-top: 2px; }
  table { width: calc(100% - 40px); margin: 16px 20px 0; border-collapse: collapse; font-size: 12px; }
  thead th {
    background: #0891b2; color: #fff; text-align: left; font-weight: 600;
    padding: 8px 10px; border: 1px solid #0e7490;
  }
  tbody td { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  th.n, td.n { text-align: right; font-variant-numeric: tabular-nums; }
  .foot {
    margin: 14px 20px 0; padding-top: 10px; border-top: 2px solid #0891b2;
    text-align: right; font-weight: 600; font-size: 13px;
  }
  .credit { margin: 24px 20px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
</style>
</head>
<body>
  <div class="band">
    <div class="brand">
      <img src="${origin}/logo.png" alt="OxyManager — Your Smart Assistant">
    </div>
    <div class="doc">${escapeHtml(title)}<small>${escapeHtml(subtitle ?? today)}</small></div>
  </div>

  ${
    cards.length
      ? `<div class="cards">${cards
          .map(
            (card) =>
              `<div class="card"><div class="k">${escapeHtml(
                card.label
              )}</div><div class="v">${escapeHtml(card.value)}</div></div>`
          )
          .join("")}</div>`
      : ""
  }

  <table>
    <thead><tr>${head
      .map((label, index) => `<th class="${isNum(index) ? "n" : ""}">${escapeHtml(label)}</th>`)
      .join("")}</tr></thead>
    <tbody>${rows
      .map(
        (row) =>
          `<tr>${row
            .map(
              (cell, index) =>
                `<td class="${isNum(index) ? "n" : ""}">${escapeHtml(cell).replace(
                  /\n/g,
                  "<br>"
                )}</td>`
            )
            .join("")}</tr>`
      )
      .join("")}</tbody>
  </table>

  ${footNote ? `<div class="foot">${escapeHtml(footNote)}</div>` : ""}

  <div class="credit"><span>${escapeHtml(today)}</span><span>oxymanager.com</span></div>
</body>
</html>`);
  win.document.close();

  // Wait for the webfont before printing, otherwise the first render can go
  // out in a fallback face. The timeout is a backstop for a blocked font CDN.
  const start = () => {
    const fonts = (win.document as Document & { fonts?: FontFaceSet }).fonts;
    // Guarded: the timeout backstop and fonts.ready can both fire, and two
    // print() calls would open the dialog twice.
    let printed = false;
    const go = () => {
      if (printed) return;
      printed = true;
      win.focus();
      win.print();
    };
    const logo = win.document.querySelector("img");
    const ready: Promise<unknown>[] = [];
    if (fonts?.ready) ready.push(fonts.ready);
    if (logo && !logo.complete) {
      ready.push(
        new Promise((resolve) => {
          logo.addEventListener("load", resolve, { once: true });
          logo.addEventListener("error", resolve, { once: true });
        })
      );
    }
    if (ready.length) {
      Promise.all(ready).then(go).catch(go);
      setTimeout(go, 3000);
    } else {
      setTimeout(go, 500);
    }
  };
  if (win.document.readyState === "complete") start();
  else win.addEventListener("load", start);

  return true;
}
