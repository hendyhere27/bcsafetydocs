// Builds the emailed COR gap-check report from an assess() result.
// All text comes from cor-gap-logic.js (our own table), never from the request.
import { PARTNER_NOTES, SECTORS } from "../cor-gap-logic.js";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SITE = "https://bcsafetydocs.com";
const STATUS_LABEL = { have: "In place", partial: "Partly", none: "Missing" };
const STATUS_COLOR = { have: "#27AE60", partial: "#E67E22", none: "#C0392B" };
const LEVEL_COLOR = { strong: "#27AE60", partly: "#E67E22", early: "#C0392B" };

const docLine = (d) =>
  d.free
    ? `<a href="${SITE}${esc(d.url)}" style="color:#1A5276;">${esc(d.title)}</a> <span style="color:#27AE60;font-weight:700;font-size:11px;">FREE</span>`
    : `${esc(d.title)} <span style="color:#777;font-size:11px;">(in the COR kit)</span>`;
const docText = (d) => (d.free ? `${d.title} (free: ${SITE}${d.url})` : `${d.title} (in the COR kit)`);

export function buildGapEmail(r) {
  const { counts, percent, level, elements, gaps, top, freeDocs, kitDocs, sector } = r;
  const color = LEVEL_COLOR[level.id];
  const headline = `${counts.have} of 13 elements in place, ${counts.partial} partly, ${counts.none} missing`;

  const chips = elements
    .map(
      (e) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #E5E5E5;font-size:14px;color:#1A1A1A;">${e.id}. ${esc(e.name)}</td>` +
        `<td style="padding:6px 0;border-bottom:1px solid #E5E5E5;font-size:13px;font-weight:700;text-align:right;color:${STATUS_COLOR[e.status]};">${STATUS_LABEL[e.status]}</td></tr>`
    )
    .join("");

  const topRows = top
    .map((g, n) => `<tr><td style="padding:6px 0;font-size:14px;color:#1A1A1A;"><strong>${n + 1}. ${esc(g.name)}</strong> <span style="color:${STATUS_COLOR[g.status]};font-size:12px;">(${STATUS_LABEL[g.status].toLowerCase()})</span></td></tr>`)
    .join("");

  const gapBlocks = gaps
    .map((g) => {
      const ready = g.ready.map((x) => `<li style="margin:3px 0;">${esc(x)}</li>`).join("");
      const docs = g.docs.map((d) => `<li style="margin:3px 0;">${docLine(d)}</li>`).join("");
      return (
        `<div style="margin:16px 0;padding:14px;border:1px solid #E5E5E5;border-left:4px solid ${STATUS_COLOR[g.status]};border-radius:3px;">` +
        `<div style="font-size:15px;font-weight:800;color:#1A1A1A;">${g.id}. ${esc(g.name)} <span style="font-size:12px;font-weight:700;color:${STATUS_COLOR[g.status]};">${STATUS_LABEL[g.status].toUpperCase()}</span></div>` +
        `<div style="font-size:12px;color:#777;margin:2px 0 8px;">${esc(g.basis)}</div>` +
        `<div style="font-size:13px;font-weight:700;color:#444;">Have ready for an audit</div>` +
        `<ul style="margin:4px 0 8px;padding-left:18px;font-size:14px;color:#444;line-height:1.5;">${ready}</ul>` +
        `<div style="font-size:13px;font-weight:700;color:#444;">Documents that cover it</div>` +
        `<ul style="margin:4px 0 0;padding-left:18px;font-size:14px;color:#444;line-height:1.5;">${docs}</ul></div>`
      );
    })
    .join("");

  const strengths = elements.filter((e) => e.status === "have");
  const strengthRows = strengths.length
    ? `<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#27AE60;margin:22px 0 4px;">Already in place</div>` +
      strengths.map((e) => `<div style="font-size:14px;color:#444;padding:2px 0;">&#10003; ${e.id}. ${esc(e.name)}</div>`).join("")
    : "";

  const missingLine =
    counts.none > 0
      ? `You're missing ${counts.none} element${counts.none === 1 ? "" : "s"}${counts.partial > 0 ? ` and have ${counts.partial} partly covered` : ""}. The kit has a document for all 13.`
      : counts.partial > 0
        ? `${counts.partial} element${counts.partial === 1 ? " is" : "s are"} only partly covered. The kit has a document for all 13.`
        : "All 13 elements are in place. The kit has a document for all 13 if you want a clean master set.";
  const BUY = "https://buy.stripe.com/14A9AScvvdV94vP0qjfEk07";
  const kitMsg = kitDocs.length
    ? `${freeDocs.length} of the documents for your gaps are free templates. The other ${kitDocs.length} are only in the COR kit ($279 CAD, 18 editable documents plus a bonus audit quick reference).`
    : freeDocs.length
      ? `Every document for your gaps has a free template, so you can start today without buying anything. The COR kit ($279 CAD) bundles all 18 documents if you'd rather have the whole set in one download.`
      : `You have every element in place. The COR kit ($279 CAD) bundles 18 editable documents if you want a clean master set to compare against.`;

  const html =
    `<!doctype html><html><body style="margin:0;background:#F4F4F4;font-family:Arial,Helvetica,sans-serif;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:6px;overflow:hidden;">` +
    `<tr><td style="background:#1A1A1A;padding:18px 24px;color:#fff;font-size:18px;font-weight:800;letter-spacing:.04em;">BC<span style="color:#F5C400;">SAFETY</span>DOCS</td></tr>` +
    `<tr><td style="padding:24px;">` +
    `<div style="font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#C0392B;">COR readiness gap check &middot; ${esc(SECTORS[sector])}</div>` +
    `<div style="font-size:26px;font-weight:800;color:#1A1A1A;margin:6px 0 10px;">Your COR gap check</div>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #E5E5E5;border-radius:6px;"><tr>` +
    `<td style="padding:16px;width:110px;text-align:center;"><div style="font-size:40px;font-weight:800;color:${color};line-height:1;">${counts.have}<span style="font-size:20px;">/13</span></div><div style="font-size:12px;color:#777;">elements in place</div></td>` +
    `<td style="padding:16px 16px 16px 0;"><div style="font-size:18px;font-weight:800;color:${color};">${esc(level.label)}</div><div style="font-size:14px;color:#444;line-height:1.5;">${esc(headline)}. ${esc(level.blurb)}</div></td>` +
    `</tr></table>` +
    (top.length
      ? `<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#C0392B;margin:22px 0 4px;">Start here</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${topRows}</table>`
      : "") +
    `<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#C0392B;margin:22px 0 4px;">All 13 elements</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${chips}</table>` +
    (gaps.length ? `<div style="font-size:20px;font-weight:800;color:#1A1A1A;margin:28px 0 0;">Your gaps, in a suggested order</div><div style="font-size:13px;color:#777;">Foundations first: policy and hazard assessment support almost everything else.</div>${gapBlocks}` : "") +
    strengthRows +
    `<div style="margin-top:24px;padding:16px;background:#FEF9E7;border-left:4px solid #F5C400;font-size:15px;line-height:1.55;color:#1A1A1A;">` +
    `<strong>${esc(missingLine)}</strong><br><span style="font-size:14px;color:#444;">${esc(kitMsg)}</span><br>` +
    `<a href="${BUY}" style="display:inline-block;margin-top:10px;background:#1A1A1A;color:#F5C400;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:3px;">Get the COR kit &mdash; $279 CAD</a>` +
    ` <a href="${SITE}/cor-kit" style="display:inline-block;margin-top:10px;margin-left:6px;color:#1A5276;font-size:14px;">See what&rsquo;s inside first</a>` +
    `<br><a href="${SITE}/cor-rebate-calculator" style="display:inline-block;margin-top:8px;color:#1A5276;font-size:13px;">What could COR be worth to you?</a></div>` +
    `<div style="font-size:15px;font-weight:700;color:#1A1A1A;margin:24px 0 4px;">How much history do you need?</div>` +
    `<div style="font-size:14px;line-height:1.55;color:#444;">Having the documents is only half of it: auditors also look for records showing the system has been running. ${esc(PARTNER_NOTES[sector])}</div>` +
    `<div style="margin-top:22px;padding:14px;background:#F4F4F4;border-left:4px solid #2C3E50;font-size:13px;line-height:1.55;color:#555;">` +
    `<strong>Please read:</strong> this is a quick self-check against the national 13-element COR framework, based only on your answers. It is not an audit, not a score your certifying partner will recognise, and not a prediction that you would pass or fail. Partners publish their own audit tools and element lists differ. BC Safety Docs is independent and not affiliated with WorkSafeBC or any certifying partner.</div>` +
    `<p style="font-size:13px;color:#777;margin-top:20px;">You asked for this report at bcsafetydocs.com. Questions? Reply to this email or write <a href="mailto:info@bcsafetydocs.com" style="color:#1A5276;">info@bcsafetydocs.com</a>.</p>` +
    `</td></tr></table></td></tr></table></body></html>`;

  const text =
    `YOUR COR GAP CHECK (${SECTORS[sector]})\n\n${counts.have} of 13 elements in place, ${counts.partial} partly, ${counts.none} missing. ${level.label}: ${level.blurb}\n\n` +
    (top.length ? `START HERE\n${top.map((g, n) => `${n + 1}. ${g.name} (${STATUS_LABEL[g.status].toLowerCase()})`).join("\n")}\n\n` : "") +
    `ALL 13 ELEMENTS\n${elements.map((e) => `${e.id}. ${e.name}: ${STATUS_LABEL[e.status]}`).join("\n")}\n\n` +
    (gaps.length
      ? `YOUR GAPS, IN A SUGGESTED ORDER\n\n` +
        gaps
          .map(
            (g) =>
              `${g.id}. ${g.name} - ${STATUS_LABEL[g.status].toUpperCase()} (${g.basis})\n  Have ready:\n${g.ready.map((x) => `   - ${x}`).join("\n")}\n  Documents:\n${g.docs.map((d) => `   - ${docText(d)}`).join("\n")}\n`
          )
          .join("\n") +
        "\n"
      : "") +
    `${missingLine}\n${kitMsg}\nGet the COR kit ($279 CAD): ${BUY}\nSee what's inside first: ${SITE}/cor-kit\nWhat could COR be worth to you? ${SITE}/cor-rebate-calculator\n\n` +
    `HOW MUCH HISTORY DO YOU NEED?\nHaving the documents is only half of it: auditors also look for records showing the system has been running. ${PARTNER_NOTES[sector]}\n\n` +
    `This is a quick self-check against the national 13-element COR framework, based only on your answers. It is not an audit, not a score your certifying partner will recognise, and not a prediction that you would pass or fail. Partners publish their own audit tools and element lists differ. BC Safety Docs is independent and not affiliated with WorkSafeBC or any certifying partner.\n\n` +
    `Questions? info@bcsafetydocs.com\n`;

  return {
    subject: `Your COR gap check: ${counts.have} of 13 elements in place`,
    html,
    text,
  };
}
