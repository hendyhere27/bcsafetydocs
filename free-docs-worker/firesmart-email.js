// Builds the emailed FireSmart self-check report from an assess() result.
// All text comes from firesmart-logic.js (our own table), never from the
// request, but everything is HTML-escaped anyway.
import { ZONES } from "../firesmart-logic.js";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const LINKS = [
  ["FireSmart BC: the Home Ignition Zone", "https://firesmartbc.ca/the-home-ignition-zone/"],
  ["FireSmart BC: Begins at Home guide", "https://begins-at-home-guide.firesmartbc.ca/"],
  ["BC Wildfire Service: FireSmart rebates", "https://blog.gov.bc.ca/bcwildfire/?p=24398"],
];

const LEVEL_COLOR = { strong: "#27AE60", good: "#2E86C1", work: "#E67E22", priority: "#C0392B" };

export function buildReportEmail(result) {
  const { score, level, items, top, strengths, answers } = result;
  const color = LEVEL_COLOR[level.id] || "#1A1A1A";

  const zoneBlocks = ZONES.map((z) => {
    const list = items.filter((i) => i.zone === z.id);
    if (!list.length) return "";
    const rows = list
      .map(
        (i) =>
          `<tr><td style="padding:12px 0;border-bottom:1px solid #E5E5E5;">` +
          `<div style="font-weight:700;font-size:15px;color:#1A1A1A;">${esc(i.title)}</div>` +
          `<div style="font-size:14px;line-height:1.55;color:#444;margin-top:4px;">${esc(i.body)}</div></td></tr>`
      )
      .join("");
    return (
      `<tr><td style="padding:22px 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#C0392B;">${esc(z.label)}</td></tr>` +
      rows
    );
  }).join("");

  const topRows = top
    .map(
      (i, n) =>
        `<tr><td style="padding:8px 0;font-size:14px;color:#1A1A1A;"><strong>${n + 1}. ${esc(i.title)}</strong></td></tr>`
    )
    .join("");

  const strengthRows = strengths.length
    ? `<tr><td style="padding:22px 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#27AE60;">What you already have going for you</td></tr>` +
      strengths.map((s) => `<tr><td style="padding:3px 0;font-size:14px;color:#444;">&#10003; ${esc(s)}</td></tr>`).join("")
    : "";

  const linkRows = LINKS.map(
    ([t, u]) => `<li style="margin:4px 0;"><a href="${esc(u)}" style="color:#1A5276;">${esc(t)}</a></li>`
  ).join("");

  const html =
    `<!doctype html><html><body style="margin:0;background:#F4F4F4;font-family:Arial,Helvetica,sans-serif;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px;">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:6px;overflow:hidden;">` +
    `<tr><td style="background:#1A1A1A;padding:18px 24px;color:#fff;font-size:18px;font-weight:800;letter-spacing:.04em;">BC<span style="color:#F5C400;">SAFETY</span>DOCS</td></tr>` +
    `<tr><td style="padding:24px;">` +
    `<div style="font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#C0392B;">BC FireSmart self-check &middot; postal prefix ${esc(answers.fsa)}</div>` +
    `<div style="font-size:26px;font-weight:800;color:#1A1A1A;margin:6px 0 14px;">Your FireSmart results</div>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #E5E5E5;border-radius:6px;"><tr>` +
    `<td style="padding:16px;width:110px;text-align:center;"><div style="font-size:44px;font-weight:800;color:${color};line-height:1;">${score}</div><div style="font-size:12px;color:#777;">out of 100</div></td>` +
    `<td style="padding:16px 16px 16px 0;"><div style="font-size:18px;font-weight:800;color:${color};">${esc(level.label)}</div><div style="font-size:14px;color:#444;line-height:1.5;">${esc(level.blurb)}</div></td>` +
    `</tr></table>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:22px 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#C0392B;">Start here</td></tr>${topRows}` +
    `${strengthRows}</table>` +
    `<div style="margin-top:26px;font-size:20px;font-weight:800;color:#1A1A1A;">Your full action plan, closest to the house first</div>` +
    `<div style="font-size:13px;color:#777;margin:4px 0 0;">FireSmart works from the home outward: the Immediate Zone matters most, then the Intermediate and Extended Zones.</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${zoneBlocks}</table>` +
    `<div style="margin-top:26px;font-size:15px;font-weight:700;color:#1A1A1A;">Official FireSmart BC resources</div>` +
    `<ul style="padding-left:18px;font-size:14px;">${linkRows}</ul>` +
    `<div style="margin-top:22px;padding:14px;background:#F4F4F4;border-left:4px solid #F5C400;font-size:13px;line-height:1.55;color:#555;">` +
    `<strong>Please read:</strong> this is a quick self-check based on your answers, not an official FireSmart Home Ignition Zone Assessment, and it does not measure the wildfire hazard of your location. ` +
    `Rebate programs generally need an assessment by a qualified Local FireSmart Representative. FireSmart&trade; is a trademark of FireSmart Canada; BC Safety Docs is independent and not affiliated with FireSmart BC or the BC Wildfire Service.</div>` +
    `<p style="font-size:13px;color:#777;margin-top:20px;">Also free from BC Safety Docs: an <a href="https://bcsafetydocs.com/emergency-response.html" style="color:#1A5276;">Emergency Response Plan template</a> for workplaces and farms. Questions? Reply to this email or write <a href="mailto:info@bcsafetydocs.com" style="color:#1A5276;">info@bcsafetydocs.com</a>.</p>` +
    `</td></tr></table></td></tr></table></body></html>`;

  const text =
    `BC FIRESMART SELF-CHECK (postal prefix ${answers.fsa})\n\n` +
    `Score: ${score}/100 - ${level.label}\n${level.blurb}\n\n` +
    `START HERE\n${top.map((i, n) => `${n + 1}. ${i.title}`).join("\n")}\n\n` +
    (strengths.length ? `WHAT YOU ALREADY HAVE GOING FOR YOU\n${strengths.map((s) => `- ${s}`).join("\n")}\n\n` : "") +
    `FULL ACTION PLAN (closest to the house first)\n\n` +
    ZONES.map((z) => {
      const list = items.filter((i) => i.zone === z.id);
      return list.length ? `${z.label.toUpperCase()}\n` + list.map((i) => `* ${i.title}\n  ${i.body}`).join("\n") + "\n" : "";
    }).join("\n") +
    `\nOFFICIAL RESOURCES\n${LINKS.map(([t, u]) => `${t}: ${u}`).join("\n")}\n\n` +
    `This is a quick self-check, not an official FireSmart Home Ignition Zone Assessment, and it does not measure the wildfire hazard of your location. ` +
    `Rebate programs generally need an assessment by a qualified Local FireSmart Representative. FireSmart is a trademark of FireSmart Canada; BC Safety Docs is not affiliated with FireSmart BC or the BC Wildfire Service.\n\n` +
    `Questions? info@bcsafetydocs.com\n`;

  return {
    subject: `Your BC FireSmart results: ${score}/100 (${level.label})`,
    html,
    text,
  };
}
