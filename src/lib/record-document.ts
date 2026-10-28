import { FILE_FIELD_KEYS, FIELD_BY_KEY, MEMBER_FIELDS, NIL } from "@/lib/member-schema";

export const CERTIFICATION_TEXT =
  "This record is a Certified copy from The Chartered Institute of Loan & Risk Management Membership Database. The member is recognized by us.";

export type DocumentOrg = {
  orgName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  supportEmail: string;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const show = (value: string | undefined) => (value ?? "").trim() || NIL;

function sheetFields(record: Record<string, string>) {
  const filed = FILE_FIELD_KEYS.map((key) => FIELD_BY_KEY[key]);
  const extra = MEMBER_FIELDS.filter(
    (field) => !FILE_FIELD_KEYS.includes(field.key) && (record[field.key] ?? "").trim().length > 0,
  );
  return [...filed, ...extra];
}

/**
 * Self-contained single-page A4 HTML copy: crest watermark, red certification
 * line and the full record. Opens in any browser and prints to one page.
 */
export function buildRecordHtml(options: {
  org: DocumentOrg;
  record: Record<string, string>;
  memberId: string;
  logoSrc: string;
  issuedAt?: string;
  source?: string;
}): string {
  const { org, record, memberId, logoSrc, source } = options;
  const issued = options.issuedAt ? new Date(options.issuedAt) : new Date();
  const fields = sheetFields(record);
  const fullName = [record.firstName, record.secondName, record.thirdName].filter(Boolean).join(" ") || NIL;
  const token = `${memberId.replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase()}-${issued.getFullYear()}`;

  const rows: string[] = [];
  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i];
    const right = fields[i + 1];
    const cell = (field: (typeof fields)[number]) => {
      const raw = (record[field.key] ?? "").trim();
      return `<th>${escapeHtml(field.label)}</th><td class="${raw ? "" : "nil"}">${escapeHtml(show(raw))}</td>`;
    };
    rows.push(`<tr>${cell(left)}${right ? cell(right) : '<th></th><td class="nil"></td>'}</tr>`);
  }

  const tiles = Array.from({ length: 9 })
    .map(() => `<img src="${logoSrc}" alt="" class="tile" />`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(memberId)} · Certified Membership Record · ${escapeHtml(org.shortName)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: #f5f5f4; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1c1917; }
  .sheet { position: relative; width: 210mm; min-height: 297mm; margin: 12px auto; padding: 12mm 13mm; background: #fff; box-shadow: 0 10px 40px -20px rgba(23,21,20,.35); overflow: hidden; }
  .wm { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
  .wm .big { position: absolute; top: 50%; left: 50%; width: 120mm; transform: translate(-50%,-50%); opacity: .10; filter: grayscale(1); }
  .wm .grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); align-content: space-between; padding: 8mm; }
  .wm .tile { width: 26mm; margin: 0 auto; opacity: .05; filter: grayscale(1); }
  .inner { position: relative; z-index: 1; display: flex; min-height: 273mm; flex-direction: column; }
  header { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #ea580c; padding-bottom: 6px; }
  header .crest { width: 19mm; height: 19mm; border: 1px solid #fed7aa; border-radius: 50%; padding: 2px; object-fit: contain; background: #fff; }
  .org { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; margin: 0; }
  .tag { font-size: 7.5pt; font-style: italic; color: #c2410c; margin: 1px 0 0; }
  .meta { font-size: 7pt; color: #78716c; margin: 1px 0 0; }
  .doc { text-align: right; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: #ea580c; margin: 0; }
  .ref { text-align: right; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 7pt; color: #78716c; margin: 2px 0 0; }
  .ident { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; border-bottom: 1px solid #e7e5e4; padding: 6px 0; }
  .lbl { font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: .14em; color: #a8a29e; margin: 0; }
  .name { font-size: 13pt; font-weight: 700; text-transform: uppercase; margin: 1px 0 0; }
  .reg { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11.5pt; font-weight: 700; color: #c2410c; margin: 1px 0 0; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; font-size: 8pt; }
  tr:nth-child(odd) { background: #fafaf9; }
  th { width: 17%; border: 1px solid #e7e5e4; padding: 1.1mm 1.5mm; text-align: left; vertical-align: top; font-size: 6.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: #78716c; }
  td { width: 33%; border: 1px solid #e7e5e4; padding: 1.1mm 1.5mm; vertical-align: top; font-weight: 500; line-height: 1.3; word-break: break-word; }
  td.nil { font-style: italic; font-weight: 400; color: #a8a29e; }
  .certified { margin-top: 10px; border: 2px solid #dc2626; border-radius: 4px; padding: 2.5mm 3mm; text-align: center; }
  .certified p { margin: 0; color: #dc2626; font-size: 9pt; font-weight: 700; line-height: 1.35; }
  footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; border-top: 1px solid #e7e5e4; padding-top: 6px; font-size: 6.5pt; color: #78716c; }
  footer p { margin: 0; }
  .sig { border-bottom: 1px solid #a8a29e; width: 46mm; margin-bottom: 4px; }
  .sign { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: #44403c; }
  .toolbar { max-width: 210mm; margin: 12px auto 0; text-align: right; }
  .toolbar button { background: #ea580c; color: #fff; border: 0; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    .sheet { width: 190mm; min-height: 0; height: 277mm; max-height: 277mm; margin: 0 auto; padding: 0; box-shadow: none; page-break-inside: avoid; page-break-after: avoid; }
    .inner { min-height: 277mm; }
    tr, table, header, footer, .certified { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="sheet">
  <div class="wm"><img src="${logoSrc}" alt="" class="big" /><div class="grid">${tiles}</div></div>
  <div class="inner">
    <header>
      <img src="${logoSrc}" alt="${escapeHtml(org.orgName)} crest" class="crest" />
      <div style="flex:1;min-width:0">
        <p class="org">${escapeHtml(org.orgName)}</p>
        <p class="tag">${escapeHtml(org.tagline)}</p>
        <p class="meta">${escapeHtml(org.supportEmail)} · www.cilrmng.org</p>
      </div>
      <div>
        <p class="doc">Certified Membership Record</p>
        <p class="ref">Ref ${escapeHtml(token)}</p>
      </div>
    </header>
    <section class="ident">
      <div>
        <p class="lbl">Name · First · Second · Third</p>
        <p class="name">${escapeHtml(fullName)}</p>
      </div>
      <div>
        <p class="lbl">Registration Number</p>
        <p class="reg">${escapeHtml(show(memberId))}</p>
      </div>
    </section>
    <table><tbody>${rows.join("")}</tbody></table>
    <section class="certified"><p>${escapeHtml(CERTIFICATION_TEXT)}</p></section>
    <footer>
      <div>
        <p>Issued ${escapeHtml(issued.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }))}</p>
        <p>${escapeHtml(source ?? "CILRMNG membership register")}</p>
      </div>
      <div style="text-align:right">
        <div class="sig"></div>
        <p class="sign">${escapeHtml(org.shortName)}</p>
        <p>Registrar · Membership Registry</p>
      </div>
    </footer>
  </div>
</div>
</body>
</html>`;
}

/** CSV copy carries the same certification statement in its header rows. */
export function buildRecordCsv(record: Record<string, string>, memberId: string): string {
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const lines = [
    escape(CERTIFICATION_TEXT),
    `${escape("Registration Number")},${escape(memberId)}`,
    `${escape("Issued")},${escape(new Date().toLocaleString("en-GB"))}`,
    "",
    "Field,Value",
  ];
  for (const field of sheetFields(record)) {
    lines.push(`${escape(field.label)},${escape(show(record[field.key]))}`);
  }
  return lines.join("\r\n");
}
